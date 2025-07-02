import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { OAuth2Client } from 'google-auth-library';

const app = express();
const PORT = 5000;

// Firebase Admin Setup
const serviceAccount = JSON.parse(readFileSync('./telemedical-project.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Google OAuth client
const client = new OAuth2Client();

// 🗓️ Create Appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const { doctorId, patientId, date, time, notes } = req.body;

    if (!doctorId || !patientId || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newAppointment = {
      doctorId,
      patientId,
      date,
      time,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('appointments').add(newAppointment);
    res.status(201).json({ message: 'Appointment saved', appointmentId: docRef.id, data: newAppointment });
  } catch (error) {
    console.error('Error saving appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 📄 Get All Appointments (admin/debug)
app.get('/api/appointments', async (req, res) => {
  try {
    const snapshot = await db.collection('appointments').get();
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this near your other app.post/app.get handlers

// POST /api/chat/:roomId/messages — add a new chat message
app.post('/api/chat/:roomId/messages', async (req, res) => {
  const { roomId } = req.params;
  const { senderId, senderName, text } = req.body;

  if (!senderId || !text) {
    return res.status(400).json({ message: 'Missing senderId or text' });
  }

  try {
    const messagesRef = db
      .collection('chatRooms')
      .doc(roomId)
      .collection('messages');

    await messagesRef.add({
      senderId,
      senderName,
      text,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/chat/:roomId/messages — get all messages for a chat room
app.get('/api/chat/:roomId/messages', async (req, res) => {
  const { roomId } = req.params;

  try {
    const messagesRef = db
      .collection('chatRooms')
      .doc(roomId)
      .collection('messages');

    const snapshot = await messagesRef.orderBy('createdAt').get();
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// 🔐 Register New User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const usersRef = db.collection('users');
    const existing = await usersRef.where('email', '==', email).get();

    if (!existing.empty) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const newUser = {
      name,
      email,
      password, // ⚠️ In production, hash this with bcrypt!
      createdAt: new Date().toISOString(),
    };

    const docRef = await usersRef.add(newUser);
    res.status(201).json({ message: 'Registration successful', userId: docRef.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// 🔐 Login User
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

    res.status(200).json({
      message: 'Login successful',
      userId: userDoc.id,
      name: user.name,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// 🔐 Google OAuth
app.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Missing token' });

    const ticket = await client.verifyIdToken({ idToken: token });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      await usersRef.add({
        name,
        email,
        provider: 'google',
        createdAt: new Date().toISOString(),
      });
    }

    res.status(200).json({ message: 'Google user authenticated', name, email });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ message: 'Invalid Google token' });
  }
});

// 📊 Personalized Dashboard Route
app.get('/api/dashboard', async (req, res) => {
  try {
    const userId = req.query.user;

    if (!userId) {
      return res.status(400).json({ message: 'Missing user ID' });
    }

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

// 🚪 Logout (placeholder)
app.post('/api/auth/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out' });
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
