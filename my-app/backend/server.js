import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { OAuth2Client } from 'google-auth-library';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss';
import path from 'path';

const app = express();
const PORT = 5000;

// ========================================
// HTTP Server & Socket.io Setup
// ========================================
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173', 
      'http://localhost:3000',
      process.env.FRONTEND_URL || 'https://your-app.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Firebase Admin Setup
const serviceAccount = {
  "type": "service_account",
  "project_id": "telemedical-project",
  "private_key_id": "a1a8bdd9470d653b7bed826c6666e030f5356564",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDKLdnN2SnhQEF7\nHnfmuXL8LHCde8utv5NqERVrxBh5cgWFzttCBnnv1+6vBjv2TYwB1KOJuWrG/dG4\neekj0lmbrpQUsMj0TQEVAOiUJPseK9Qd1sasYtItnlHYqCvvTbgUdOtm36Cc2/4C\ngGRB3s8KTGwU6W/1Iron6h543pD8RZ+LH2F7nqlreyf91Rgch7kA58Ij/AjOWh3K\n7OIc8ta3CxgaY4agTd7GT2y8O05KlqeUPn3zT+rHSPM2YCwCe6Y/zUsmUiVj5cnM\n9cADTsbzbGHVW2ahRaiEVEN0EMCxKpQa9tLrTvi0BVE8AP3IK1GZVSwSYuCB0DTJ\ny3kH8j7RAgMBAAECggEAGEFo9Hu9vQLe+DzfCKSuCVfxiMs909H8hwiWp8+mWgeW\nZwe6oVCyl1YyEfhvAC0sg1m15wOCLm5sFzQ1BrGpQ3at2E+fREPqwdDSlldbczKx\n54SJYEwYyBVK33HJl5Oc5oNibHyewcLY1gb+QDLRZvxlKRsabe/lIn3BeyHEhidD\nV3TA93BuXmeZUtB1obm6Hk2iHo4FZ5iqzOH++UK/rfLrhyicNJ6KIh61eoSjd4bk\nxpjdnsD0rPPkIRcJ7IngRJXRdULg99kB9vd0UKvDzt53A3mgM8EEsScmDOWIvk2R\nBaP0I6kOlrJrQ/VoPT8T2bazNDJRShVXBFaOQgDsGQKBgQD6M31Sm3pjuoKiSRtv\nJP0hVYm/y2zUrT9yCf8WeMnKmhdm9v50LnVU9bHvJ4FC682qvp+FOLBDyrRpVTqW\ny1DxEfYd0/pSmASQuAsL7FyLbICtJ8CiwAQ7vTGrlTEr1pYrLb14A6om0ZeoroEN\nRTDPS1vORuf37Ad7vvJV/iJVLQKBgQDO3W8F/yyhSW6oTaoyKst4+yFN5PfaAB5z\ngVi51syxo8cvBwfoOUP6E0UWhbquCGBdHRGGidz23+jIsAZwa6z8LTPr9KRMal1Q\nVIIlNsVI30MqK+YWCB/j6G66L9zXhmMBn+EkWPYQdK+XxbEpx2zB7tEkQ+8IalQ8\nzivFImvetQKBgCvmWufipd/XutIUt76Ro+R0aL4BSHAskcRFor9jpCxrSw3i6pSi\nDi5BCd5ndROz4htCZSTv5GWQrIUK0kPhGquhtihXqEVTrQFjeXS3HSnNeOpo3jDw\nNg3xTUTI4Z7KgQDEfskPA4zaG50aOUSFzmGg3FPeNxdWD54Ty9twwr9lAoGBAKCQ\n5d08vLKQIfFHH0UDTJ4iJy6j+/HdR8WV732ICagUnMWW6n9I+8d+75BUyprM66c6\nqeDI35dMIw6q+sSF/2ZZ28RZRrH9mWKBxecGxUkT6rkwC86sDbzELDYecodjyzN2\nmrWwy4XoXGcszp/EKFm7eeBxTnc0uR/dU8IXPq1FAoGAe4V4dr4+a1RSqIorXa6i\nyRSilbL/Bvzw/Hx2ccCfl7UwLs4WXkoYnVhahXFOpo2zb49bzoVBplveFg/64VjK\n502fKRg9vVThZX1BAzzKVDitMopO47sy2kn8gnBUtrBP4PzSvTH73hdDDGxhIDAM\nT0gnjESc4KozV301mzh6/Yc=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@telemedical-project.iam.gserviceaccount.com",
  "client_id": "103741063158016132804",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40telemedical-project.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
initializeApp({ 
  credential: cert(serviceAccount),
  storageBucket: 'telemedical-project.appspot.com'
});

const db = getFirestore();
const bucket = getStorage().bucket();
const auth = getAuth();

// Middleware
app.use(helmet());
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://my-react-py2zfiggv-khadijahs-projects-5afec56d.vercel.app/',
  ], 
  credentials: true 
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'your-google-client-id');

// ========================================
// File Upload Configuration
// ========================================
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Invalid file type'));
  }
});

// ========================================
// Utility Functions
// ========================================
const sanitizeInput = (text) => {
  return xss(text, { whiteList: {}, stripIgnoreTag: true });
};

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    // Try ID token first
    try {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = decodedToken;
      return next();
    } catch (e) {
      // Try custom token
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        req.user = payload;
        return next();
      }
      throw e;
    }
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// ========================================
// Socket.io - Real-time Chat
// ========================================
const activeUsers = new Map();
const typingUsers = new Map();

// FIXED: Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.error('❌ Socket connection rejected: No token provided');
      return next(new Error('Auth error: No token provided'));
    }

    let decodedToken;
    
    try {
      // Try to verify as ID token first
      decodedToken = await auth.verifyIdToken(token);
      console.log('✅ Verified as ID token for user:', decodedToken.uid);
    } catch (idTokenError) {
      // Fallback: Try to decode as custom token (JWT)
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64').toString('utf-8')
        );
        
        decodedToken = payload;
        console.log('✅ Verified as custom token for user:', decodedToken.uid || decodedToken.sub);
      } catch (decodeError) {
        console.error('❌ Token decode error:', decodeError.message);
        return next(new Error(`Auth error: Invalid token`));
      }
    }
    
    socket.userId = decodedToken.uid || decodedToken.sub || 'unknown';
    socket.userEmail = decodedToken.email || 'unknown@email.com';
    socket.userName = decodedToken.name || decodedToken.email || 'Anonymous User';
    
    console.log(`✅ Socket auth successful for user: ${socket.userId}`);
    next();
  } catch (error) {
    console.error('❌ Socket auth error:', error.message);
    next(new Error(`Auth error: ${error.message}`));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.userId} (${socket.id})`);
  
  activeUsers.set(socket.userId, {
    socketId: socket.id,
    userId: socket.userId,
    userName: socket.userName,
    userEmail: socket.userEmail,
    lastSeen: new Date()
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.currentRoom = roomId;
    
    console.log(`👤 User ${socket.userId} joined room ${roomId}`);
    
    io.to(roomId).emit('user-joined', {
      userId: socket.userId,
      userName: socket.userName,
      timestamp: new Date()
    });
    
    const roomUsers = Array.from(activeUsers.values()).filter(u => 
      io.sockets.adapter.rooms.get(roomId)?.has(u.socketId)
    );
    socket.emit('room-users', roomUsers);
  });

  socket.on('send-message', async (data) => {
    try {
      const { roomId, text, replyTo } = data;
      const sanitizedText = sanitizeInput(text);
      
      if (!sanitizedText || sanitizedText.length > 5000) {
        socket.emit('error', { message: 'Invalid message length' });
        return;
      }

      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId,
        senderId: socket.userId,
        senderName: socket.userName,
        text: sanitizedText,
        replyTo: replyTo || null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deleted: false,
        edited: false,
        reactions: {},
        readBy: [socket.userId],
        deliveredTo: [socket.userId],
        status: 'delivered'
      };

      await db.collection('chatRooms').doc(roomId).collection('messages').doc(message.id).set(message);

      io.to(roomId).emit('new-message', message);
      socket.emit('message-delivered', { messageId: message.id });

      typingUsers.delete(socket.userId);
      io.to(roomId).emit('user-stop-typing', { userId: socket.userId });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', (roomId) => {
    typingUsers.set(socket.userId, { roomId, userName: socket.userName });
    socket.to(roomId).emit('user-typing', { userId: socket.userId, userName: socket.userName });
  });

  socket.on('stop-typing', (roomId) => {
    typingUsers.delete(socket.userId);
    socket.to(roomId).emit('user-stop-typing', { userId: socket.userId });
  });

  socket.on('mark-read', async ({ roomId, messageId }) => {
    try {
      const messageRef = db.collection('chatRooms').doc(roomId).collection('messages').doc(messageId);
      await messageRef.update({
        readBy: getFirestore.FieldValue.arrayUnion(socket.userId)
      });
      io.to(roomId).emit('message-read', { messageId, userId: socket.userId });
    } catch (error) {
      console.error('Error marking read:', error);
    }
  });

  socket.on('edit-message', async ({ roomId, messageId, newText }) => {
    try {
      const sanitizedText = sanitizeInput(newText);
      const messageRef = db.collection('chatRooms').doc(roomId).collection('messages').doc(messageId);
      const messageDoc = await messageRef.get();
      
      if (!messageDoc.exists || messageDoc.data().senderId !== socket.userId) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      
      await messageRef.update({
        text: sanitizedText,
        edited: true,
        updatedAt: new Date().toISOString()
      });
      
      io.to(roomId).emit('message-edited', { messageId, newText: sanitizedText, edited: true });
    } catch (error) {
      socket.emit('error', { message: 'Failed to edit' });
    }
  });

  socket.on('delete-message', async ({ roomId, messageId }) => {
    try {
      const messageRef = db.collection('chatRooms').doc(roomId).collection('messages').doc(messageId);
      const messageDoc = await messageRef.get();
      
      if (!messageDoc.exists || messageDoc.data().senderId !== socket.userId) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      
      await messageRef.update({
        deleted: true,
        text: '[Message deleted]',
        updatedAt: new Date().toISOString()
      });
      
      io.to(roomId).emit('message-deleted', { messageId });
    } catch (error) {
      socket.emit('error', { message: 'Failed to delete' });
    }
  });

  socket.on('add-reaction', async ({ roomId, messageId, emoji }) => {
    try {
      const messageRef = db.collection('chatRooms').doc(roomId).collection('messages').doc(messageId);
      await messageRef.update({
        [`reactions.${emoji}`]: getFirestore.FieldValue.arrayUnion(socket.userId)
      });
      io.to(roomId).emit('reaction-added', { messageId, emoji, userId: socket.userId });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.userId}`);
    if (socket.currentRoom) {
      io.to(socket.currentRoom).emit('user-left', {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date()
      });
    }
    activeUsers.delete(socket.userId);
    typingUsers.delete(socket.userId);
  });
});

// ========================================
// 🔐 AUTHENTICATION ROUTES
// ========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const usersRef = db.collection('users');
    const existing = await usersRef.where('email', '==', email).get();

    if (!existing.empty) {
      return res.status(409).json({ message: 'User already exists' });
    }

    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email: email,
        password: password,
        displayName: name
      });
    } catch (authError) {
      console.warn('Firebase user creation skipped:', authError.message);
    }

    const newUser = {
      name,
      email,
      password,
      firebaseUid: firebaseUser?.uid || null,
      provider: 'email',
      createdAt: new Date().toISOString(),
    };

    const docRef = await usersRef.add(newUser);
    
    let customToken = null;
    try {
      customToken = await auth.createCustomToken(docRef.id);
    } catch (e) {
      console.warn('Token generation skipped:', e.message);
    }

    res.status(201).json({ 
      message: 'Registration successful', 
      userId: docRef.id,
      token: customToken,
      name: name,
      email: email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).json({ message: 'User not found' });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    if (user.password !== password) {
      return res.status(403).json({ message: 'Incorrect password' });
    }

    let customToken;
    try {
      customToken = await auth.createCustomToken(userDoc.id);
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return res.status(500).json({ message: 'Failed to generate auth token' });
    }

    res.status(200).json({
      message: 'Login successful',
      userId: userDoc.id,
      name: user.name,
      email: user.email,
      token: customToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Missing token' });

    const ticket = await client.verifyIdToken({ idToken: token });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    let userId;
    if (snapshot.empty) {
      const docRef = await usersRef.add({
        name,
        email,
        picture: picture || null,
        provider: 'google',
        createdAt: new Date().toISOString(),
      });
      userId = docRef.id;
    } else {
      userId = snapshot.docs[0].id;
    }

    let customToken;
    try {
      customToken = await auth.createCustomToken(userId);
    } catch (e) {
      console.warn('Token generation skipped:', e.message);
    }

    res.status(200).json({ 
      message: 'Google user authenticated', 
      name, 
      email,
      userId,
      token: customToken
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ message: 'Invalid Google token' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

// ========================================
// 💬 CHAT REST API ROUTES
// ========================================

app.get('/api/chat/:roomId/messages', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const lastMessageId = req.query.lastMessageId;

    const messagesRef = db.collection('chatRooms').doc(roomId).collection('messages');
    let query = messagesRef.orderBy('createdAt', 'desc').limit(limit);

    if (lastMessageId) {
      const lastDoc = await messagesRef.doc(lastMessageId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ messages: messages.reverse(), hasMore: messages.length === limit });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/chat/:roomId/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const { roomId } = req.params;
    const fileName = `${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(`chat-files/${roomId}/${fileName}`);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: { uploadedBy: req.user.uid, originalName: req.file.originalname }
      }
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      senderId: req.user.uid,
      senderName: req.user.name || req.user.email,
      type: 'file',
      fileUrl: url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      createdAt: new Date().toISOString(),
      deleted: false,
      readBy: [req.user.uid]
    };

    await db.collection('chatRooms').doc(roomId).collection('messages').doc(message.id).set(message);

    res.json({ success: true, url, message });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/chat/:roomId/search', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query too short' });
    }

    const snapshot = await db.collection('chatRooms').doc(roomId).collection('messages')
      .where('deleted', '==', false)
      .get();

    const messages = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(msg => msg.text?.toLowerCase().includes(query.toLowerCase()));

    res.json({ messages });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ========================================
// 🗓️ APPOINTMENT ROUTES
// ========================================

app.get('/api/appointments/check', async (req, res) => {
  try {
    const { date, time, doctorId } = req.query;

    if (!date || !time || !doctorId) {
      return res.status(400).json({ message: 'Date, time, and doctorId are required' });
    }

    const snapshot = await db
      .collection('appointments')
      .where('date', '==', date)
      .where('time', '==', time)
      .where('doctorId', '==', doctorId)
      .get();

    res.status(200).json({ exists: !snapshot.empty });
  } catch (error) {
    console.error('Error checking appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/appointments', verifyToken, async (req, res) => {
  try {
    const { doctorId, patientId, date, time, notes } = req.body;

    if (!doctorId || !patientId || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingSnapshot = await db
      .collection('appointments')
      .where('date', '==', date)
      .where('time', '==', time)
      .where('doctorId', '==', doctorId)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    const newAppointment = {
      doctorId,
      patientId,
      date,
      time,
      notes: notes || '',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('appointments').add(newAppointment);
    res.status(201).json({ 
      message: 'Appointment saved', 
      appointmentId: docRef.id, 
      data: newAppointment 
    });
  } catch (error) {
    console.error('Error saving appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/appointments', verifyToken, async (req, res) => {
  try {
    const { patientId, doctorId } = req.query;

    let query = db.collection('appointments');

    if (patientId) {
      query = query.where('patientId', '==', patientId);
    }
    if (doctorId) {
      query = query.where('doctorId', '==', doctorId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// 📊 DASHBOARD ROUTES
// ========================================

app.get('/api/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const snapshot = await db
      .collection('appointments')
      .where('patientId', '==', userId)
      .orderBy('date')
      .get();

    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const total = appointments.length;
    const next = appointments.find(appt => new Date(appt.date) >= new Date()) || null;

    res.status(200).json({
      appointments,
      stats: { total, next },
    });
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ========================================
// 🚀 Start Server
// ========================================
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Socket.io enabled for real-time chat`);
  console.log(`✅ CORS enabled for http://localhost:5173 and http://localhost:3000`);
});