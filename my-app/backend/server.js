import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { OAuth2Client } from 'google-auth-library';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss';
import bcrypt from 'bcrypt';
import path from 'path';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// CORS — must come BEFORE helmet
// ========================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options(/.*/, cors());

// ========================================
// HTTP Server & Socket.io
// ========================================
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ========================================
// Firebase Admin
// ========================================
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const db = getFirestore();
const bucket = getStorage().bucket();
const auth = getAuth();

// ========================================
// Middleware
// ========================================
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());

// Rate limiter — 100 requests per minute per IP on all /api/ routes
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter limiter for auth endpoints to slow down brute force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per 15 min per IP
  message: { message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ========================================
// File Upload
// ========================================
const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Invalid file type. Allowed: jpeg, jpg, png, gif, pdf, doc, docx, txt'));
  },
});

// ========================================
// Helpers
// ========================================
const sanitizeInput = (text) =>
  xss(text, { whiteList: {}, stripIgnoreTag: true });

// ─── FIX 1: verifyToken — removed unsafe JWT fallback ────────────────────────
//
// Previously: if Firebase token verification failed, the code would manually
// base64-decode the JWT payload WITHOUT checking the signature. Anyone could
// craft a fake token with any uid and bypass authentication entirely.
//
// Now: if Firebase rejects the token for any reason, we reject the request.
// Period. No fallback, no exceptions.
//
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Firebase verifyIdToken checks the signature, expiry, and issuer.
    // If any of those fail, it throws — and we catch it below.
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ─── Helper: verify a user belongs to a chat room ────────────────────────────
//
// This is used to prevent authenticated users from reading other people's chats.
// The roomId in our app is the appointmentId — so we check that the requesting
// user is either the patient or the doctor on that appointment.
//
const verifyRoomMembership = async (userId, roomId) => {
  const apptDoc = await db.collection('appointments').doc(roomId).get();
  if (!apptDoc.exists) return false;
  const appt = apptDoc.data();
  return appt.patientId === userId || appt.doctorId === userId;
};

// ========================================
// Socket.io Auth — FIX 2: same fix as verifyToken
// ========================================
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Auth error: No token provided'));

    // Only Firebase verification — no unsafe fallback
    const decodedToken = await auth.verifyIdToken(token);

    socket.userId    = decodedToken.uid;
    socket.userEmail = decodedToken.email || '';
    socket.userName  = decodedToken.name || decodedToken.email || 'Anonymous';

    next();
  } catch (error) {
    next(new Error('Auth error: Invalid or expired token'));
  }
});

// ========================================
// Socket.io — Real-time Chat
// ========================================
const activeUsers = new Map();
const typingUsers  = new Map();

io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.userId} (${socket.id})`);

  activeUsers.set(socket.userId, {
    socketId:  socket.id,
    userId:    socket.userId,
    userName:  socket.userName,
    userEmail: socket.userEmail,
    lastSeen:  new Date(),
  });

  // ── join-room — FIX 3: verify membership before joining ──────────────────
  socket.on('join-room', async (roomId) => {
    try {
      const isMember = await verifyRoomMembership(socket.userId, roomId);
      if (!isMember) {
        socket.emit('error', { message: 'You do not have access to this room' });
        return;
      }

      socket.join(roomId);
      socket.currentRoom = roomId;

      io.to(roomId).emit('user-joined', {
        userId:    socket.userId,
        userName:  socket.userName,
        timestamp: new Date(),
      });

      const roomUsers = Array.from(activeUsers.values()).filter((u) =>
        io.sockets.adapter.rooms.get(roomId)?.has(u.socketId)
      );
      socket.emit('room-users', roomUsers);
    } catch (err) {
      console.error('join-room error:', err);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // ── send-message ──────────────────────────────────────────────────────────
  socket.on('send-message', async (data) => {
    try {
      const { roomId, text, replyTo } = data;

      if (!roomId || !text) {
        socket.emit('error', { message: 'roomId and text are required' });
        return;
      }

      const sanitizedText = sanitizeInput(text);
      if (!sanitizedText || sanitizedText.length > 5000) {
        socket.emit('error', { message: 'Invalid message length (max 5000 chars)' });
        return;
      }

      // Confirm the socket is actually in this room (joined via join-room above)
      if (!socket.rooms.has(roomId)) {
        socket.emit('error', { message: 'Not a member of this room' });
        return;
      }

      const message = {
        id:          `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId,
        senderId:    socket.userId,
        senderName:  socket.userName,
        text:        sanitizedText,
        replyTo:     replyTo || null,
        createdAt:   new Date().toISOString(),
        updatedAt:   null,
        deleted:     false,
        edited:      false,
        reactions:   {},
        readBy:      [socket.userId],
        deliveredTo: [socket.userId],
        status:      'delivered',
      };

      await db
        .collection('chatRooms')
        .doc(roomId)
        .collection('messages')
        .doc(message.id)
        .set(message);

      io.to(roomId).emit('new-message', message);
      socket.emit('message-delivered', { messageId: message.id });

      typingUsers.delete(socket.userId);
      io.to(roomId).emit('user-stop-typing', { userId: socket.userId });
    } catch (error) {
      console.error('send-message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ── typing indicators ─────────────────────────────────────────────────────
  socket.on('typing', (roomId) => {
    typingUsers.set(socket.userId, { roomId, userName: socket.userName });
    socket.to(roomId).emit('user-typing', { userId: socket.userId, userName: socket.userName });
  });

  socket.on('stop-typing', (roomId) => {
    typingUsers.delete(socket.userId);
    socket.to(roomId).emit('user-stop-typing', { userId: socket.userId });
  });

  // ── mark-read ─────────────────────────────────────────────────────────────
  socket.on('mark-read', async ({ roomId, messageId }) => {
    try {
      const messageRef = db
        .collection('chatRooms')
        .doc(roomId)
        .collection('messages')
        .doc(messageId);

      await messageRef.update({
        readBy: FieldValue.arrayUnion(socket.userId),
      });

      io.to(roomId).emit('message-read', { messageId, userId: socket.userId });
    } catch (error) {
      console.error('mark-read error:', error);
    }
  });

  // ── edit-message — only the sender can edit ───────────────────────────────
  socket.on('edit-message', async ({ roomId, messageId, newText }) => {
    try {
      const sanitizedText = sanitizeInput(newText);
      if (!sanitizedText || sanitizedText.length > 5000) {
        socket.emit('error', { message: 'Invalid message text' });
        return;
      }

      const messageRef = db
        .collection('chatRooms')
        .doc(roomId)
        .collection('messages')
        .doc(messageId);

      const messageDoc = await messageRef.get();

      if (!messageDoc.exists) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      if (messageDoc.data().senderId !== socket.userId) {
        socket.emit('error', { message: 'Unauthorized: you can only edit your own messages' });
        return;
      }

      await messageRef.update({
        text:      sanitizedText,
        edited:    true,
        updatedAt: new Date().toISOString(),
      });

      io.to(roomId).emit('message-edited', { messageId, newText: sanitizedText, edited: true });
    } catch {
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // ── delete-message — only the sender can delete ───────────────────────────
  socket.on('delete-message', async ({ roomId, messageId }) => {
    try {
      const messageRef = db
        .collection('chatRooms')
        .doc(roomId)
        .collection('messages')
        .doc(messageId);

      const messageDoc = await messageRef.get();

      if (!messageDoc.exists) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      if (messageDoc.data().senderId !== socket.userId) {
        socket.emit('error', { message: 'Unauthorized: you can only delete your own messages' });
        return;
      }

      await messageRef.update({
        deleted:   true,
        text:      '[Message deleted]',
        updatedAt: new Date().toISOString(),
      });

      io.to(roomId).emit('message-deleted', { messageId });
    } catch {
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // ── add-reaction ──────────────────────────────────────────────────────────
  socket.on('add-reaction', async ({ roomId, messageId, emoji }) => {
    try {
      // Basic emoji validation — prevent arbitrary strings
      if (!emoji || emoji.length > 10) {
        socket.emit('error', { message: 'Invalid emoji' });
        return;
      }

      const messageRef = db
        .collection('chatRooms')
        .doc(roomId)
        .collection('messages')
        .doc(messageId);

      await messageRef.update({
        [`reactions.${emoji}`]: FieldValue.arrayUnion(socket.userId),
      });

      io.to(roomId).emit('reaction-added', { messageId, emoji, userId: socket.userId });
    } catch (error) {
      console.error('add-reaction error:', error);
    }
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.userId}`);

    if (socket.currentRoom) {
      io.to(socket.currentRoom).emit('user-left', {
        userId:    socket.userId,
        userName:  socket.userName,
        timestamp: new Date(),
      });
    }

    activeUsers.delete(socket.userId);
    typingUsers.delete(socket.userId);
  });
});

// ========================================
// 🔐 AUTH ROUTES
// ========================================

// Register
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const usersRef = db.collection('users');
    const existing = await usersRef.where('email', '==', email).get();

    if (!existing.empty) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // cost 12 is stronger than 10

    // Create in Firebase Auth too so verifyIdToken works end-to-end
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({ email, password, displayName: name });
    } catch (authError) {
      console.warn('Firebase Auth user creation skipped:', authError.message);
    }

    const newUser = {
      name:        sanitizeInput(name),
      email,
      password:    hashedPassword,
      firebaseUid: firebaseUser?.uid || null,
      provider:    'email',
      role:        'patient', // default role
      createdAt:   new Date().toISOString(),
    };

    const docRef = await usersRef.add(newUser);

    // Use Firebase UID if available (so verifyIdToken works), else Firestore doc ID
    const tokenUserId = firebaseUser?.uid || docRef.id;
    const customToken = await auth.createCustomToken(tokenUserId);

    res.status(201).json({
      message: 'Registration successful',
      userId:  docRef.id,
      token:   customToken,
      name:    newUser.name,
      email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      // Use a generic message — don't reveal whether the email exists
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const userDoc  = snapshot.docs[0];
    const userData = userDoc.data();

    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Use Firebase UID if we have it, otherwise Firestore doc ID
    const tokenUserId = userData.firebaseUid || userDoc.id;
    const customToken = await auth.createCustomToken(tokenUserId);

    res.status(200).json({
      message: 'Login successful',
      userId:  userDoc.id,
      name:    userData.name,
      email:   userData.email,
      role:    userData.role || 'patient',
      token:   customToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ─── FIX 4: Google OAuth — moved to /api/auth/google to match frontend ───────
//
// Previously this was at /auth/google (no /api/ prefix) which meant:
// - It was outside the rate limiter (anyone could hammer it)
// - It was inconsistent with every other auth route
// - The frontend LoginPage.jsx was already calling the wrong path
//
// Update your frontend LoginPage.jsx to call /api/auth/google instead of /auth/google
//
app.post('/api/auth/google', authLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Missing token' });

    const ticket  = await googleClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    let userId;
    if (snapshot.empty) {
      // New Google user — create their record
      const docRef = await usersRef.add({
        name,
        email,
        picture:   picture || null,
        provider:  'google',
        role:      'patient',
        createdAt: new Date().toISOString(),
      });
      userId = docRef.id;
    } else {
      userId = snapshot.docs[0].id;
    }

    const customToken = await auth.createCustomToken(userId);

    res.status(200).json({
      message: 'Google user authenticated',
      name,
      email,
      userId,
      token: customToken,
    });
  } catch (err) {
    console.error('Google Auth error:', err);
    res.status(401).json({ message: 'Invalid Google token' });
  }
});

// Logout — stateless (JWT), just confirms client-side removal is correct
app.post('/api/auth/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

// ========================================
// 👤 USER ROUTES
// ========================================

app.get('/api/user/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Try to find user by firebaseUid first, then by doc ID
    let userDoc = null;
    const byFirebaseUid = await db.collection('users').where('firebaseUid', '==', uid).get();

    if (!byFirebaseUid.empty) {
      userDoc = byFirebaseUid.docs[0];
    } else {
      const byDocId = await db.collection('users').doc(uid).get();
      if (byDocId.exists) userDoc = byDocId;
    }

    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = userDoc.data();

    // Never return the hashed password to the frontend
    const { password: _removed, ...safeData } = data;

    res.json({ id: userDoc.id, ...safeData });
  } catch (error) {
    console.error('GET /api/user/me error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/user/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, phone, bio } = req.body;

    // Only allow safe fields to be updated — never let the client update
    // email, password, role, or firebaseUid through this endpoint
    const updates = {};
    if (name  !== undefined) updates.name  = sanitizeInput(name);
    if (phone !== undefined) updates.phone = sanitizeInput(phone);
    if (bio   !== undefined) updates.bio   = sanitizeInput(bio);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updatedAt = new Date().toISOString();

    // Find the user's Firestore doc
    const byFirebaseUid = await db.collection('users').where('firebaseUid', '==', uid).get();

    let docRef;
    if (!byFirebaseUid.empty) {
      docRef = byFirebaseUid.docs[0].ref;
    } else {
      docRef = db.collection('users').doc(uid);
    }

    await docRef.update(updates);
    res.json({ message: 'Profile updated', updates });
  } catch (error) {
    console.error('PUT /api/user/me error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ========================================
// 💬 CHAT ROUTES
// ========================================

// ─── FIX 5: Chat messages — verify room membership before returning data ──────
//
// Previously any authenticated user could read any chat room's messages
// just by knowing (or guessing) the roomId. Now we check the appointments
// collection to confirm the requesting user is the patient or doctor.
//
app.get('/api/chat/:roomId/messages', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.uid;

    const isMember = await verifyRoomMembership(userId, roomId);
    if (!isMember) {
      return res.status(403).json({ error: 'You do not have access to this chat room' });
    }

    const limit         = Math.min(parseInt(req.query.limit) || 50, 100); // cap at 100
    const lastMessageId = req.query.lastMessageId;

    const messagesRef = db.collection('chatRooms').doc(roomId).collection('messages');
    let query = messagesRef.orderBy('createdAt', 'desc').limit(limit);

    if (lastMessageId) {
      const lastDoc = await messagesRef.doc(lastMessageId).get();
      if (lastDoc.exists) query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    const messages  = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.json({ messages: messages.reverse(), hasMore: messages.length === limit });
  } catch (error) {
    console.error('GET /api/chat/:roomId/messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// File upload — also check membership
app.post('/api/chat/:roomId/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { roomId } = req.params;
    const userId = req.user.uid;

    const isMember = await verifyRoomMembership(userId, roomId);
    if (!isMember) {
      return res.status(403).json({ error: 'You do not have access to this chat room' });
    }

    // Sanitize filename to prevent path traversal
    const safeFileName = path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}_${safeFileName}`;
    const file     = bucket.file(`chat-files/${roomId}/${fileName}`);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy:   userId,
          originalName: req.file.originalname,
        },
      },
    });

    const [url] = await file.getSignedUrl({
      action:  'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const message = {
      id:        `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      senderId:  userId,
      senderName: req.user.name || req.user.email,
      type:      'file',
      fileUrl:   url,
      fileName:  req.file.originalname,
      fileType:  req.file.mimetype,
      fileSize:  req.file.size,
      createdAt: new Date().toISOString(),
      deleted:   false,
      readBy:    [userId],
    };

    await db
      .collection('chatRooms')
      .doc(roomId)
      .collection('messages')
      .doc(message.id)
      .set(message);

    res.json({ success: true, url, message });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Chat search — also check membership
app.get('/api/chat/:roomId/search', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { query }  = req.query;
    const userId     = req.user.uid;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const isMember = await verifyRoomMembership(userId, roomId);
    if (!isMember) {
      return res.status(403).json({ error: 'You do not have access to this chat room' });
    }

    // Note: Firestore doesn't support full-text search natively.
    // This fetches all non-deleted messages and filters in memory.
    // For production scale, consider Algolia or Typesense.
    const snapshot = await db
      .collection('chatRooms')
      .doc(roomId)
      .collection('messages')
      .where('deleted', '==', false)
      .get();

    const messages = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((msg) => msg.text?.toLowerCase().includes(query.toLowerCase()));

    res.json({ messages });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ========================================
// 🗓️ APPOINTMENT ROUTES
// ========================================

// ─── FIX 6: /check now requires auth ─────────────────────────────────────────
//
// Previously this had no verifyToken — anyone on the internet could probe
// which time slots are booked for any doctor. Now requires a valid session.
//
app.get('/api/appointments/check', verifyToken, async (req, res) => {
  try {
    const { date, time, doctorId } = req.query;

    if (!date || !time || !doctorId) {
      return res.status(400).json({ message: 'date, time, and doctorId are required' });
    }

    const snapshot = await db
      .collection('appointments')
      .where('date',     '==', date)
      .where('time',     '==', time)
      .where('doctorId', '==', doctorId)
      .get();

    res.status(200).json({ exists: !snapshot.empty });
  } catch (error) {
    console.error('Appointment check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create appointment
app.post('/api/appointments', verifyToken, async (req, res) => {
  try {
    const { doctorId, date, time, notes } = req.body;

    // ─── FIX 7: patientId always comes from the verified token ───────────────
    //
    // Previously patientId came from req.body, meaning a user could book
    // an appointment on behalf of someone else by sending a different ID.
    //
    const patientId = req.user.uid;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ error: 'doctorId, date, and time are required' });
    }

    // Double-check the slot isn't already taken
    const existingSnapshot = await db
      .collection('appointments')
      .where('date',     '==', date)
      .where('time',     '==', time)
      .where('doctorId', '==', doctorId)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(409).json({ error: 'This time slot is already booked. Please choose another.' });
    }

    const newAppointment = {
      doctorId,
      patientId,
      date,
      time,
      notes:     sanitizeInput(notes || ''),
      status:    'scheduled',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('appointments').add(newAppointment);

    res.status(201).json({
      message:       'Appointment booked successfully',
      appointmentId: docRef.id,
      data:          newAppointment,
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── FIX 8: GET appointments — always scoped to the requesting user ───────────
//
// Previously the route accepted patientId/doctorId as query params from the client,
// meaning any logged-in user could read anyone else's appointments.
// Now the user's ID always comes from their verified token.
//
app.get('/api/appointments', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // A user can see appointments where they are the patient OR the doctor
    // We run two queries and merge (Firestore doesn't support OR queries across fields)
    const [asPatient, asDoctor] = await Promise.all([
      db.collection('appointments').where('patientId', '==', userId).orderBy('createdAt', 'desc').get(),
      db.collection('appointments').where('doctorId',  '==', userId).orderBy('createdAt', 'desc').get(),
    ]);

    const seen = new Set();
    const appointments = [];

    for (const doc of [...asPatient.docs, ...asDoctor.docs]) {
      if (!seen.has(doc.id)) {
        seen.add(doc.id);
        appointments.push({ id: doc.id, ...doc.data() });
      }
    }

    // Sort merged results by createdAt descending
    appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(appointments);
  } catch (error) {
    console.error('GET appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// 📊 DASHBOARD ROUTE
// ========================================
app.get('/api/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const snapshot = await db
      .collection('appointments')
      .where('patientId', '==', userId)
      .orderBy('date')
      .get();

    const appointments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const total = appointments.length;
    const next  = appointments.find((appt) => new Date(appt.date) >= new Date()) || null;

    res.status(200).json({ appointments, stats: { total, next } });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ========================================
// 📬 CONTACT ROUTE
// ========================================
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email, and message are required' });
    }

    await db.collection('contactMessages').add({
      name:      sanitizeInput(name),
      email,
      phone:     phone || '',
      subject:   subject || 'General',
      message:   sanitizeInput(message),
      createdAt: new Date().toISOString(),
      read:      false,
    });

    res.status(201).json({ message: 'Message received. We will get back to you shortly.' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ========================================
// 🚀 Start Server
// ========================================
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Socket.io enabled`);
  console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
});