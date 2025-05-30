import express from 'express';
import cors from 'cors';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Load Firebase Admin credentials
const serviceAccount = JSON.parse(readFileSync('./telemedical-projeect.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// POST /api/appointments - Save appointment to Firestore
app.post('/api/appointments', async (req, res) => {
  console.log('✔️ Hit /api/appointments route');
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

    res.status(201).json({
      message: 'Appointment saved successfully',
      appointmentId: docRef.id,
      data: newAppointment,
    });
  } catch (error) {
    console.error('Error saving appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/appointments - Fetch all appointments from Firestore
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

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
