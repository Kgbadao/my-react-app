import express from 'express';
import { db } from '../firebase.js';

const router = express.Router();

router.post('/appointments', async (req, res) => {
  try {
    const { date, time, doctor, userId } = req.body;
    if (!date || !time || !doctor || !userId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newAppointment = { date, time, doctor, userId, createdAt: new Date() };
    const docRef = await db.collection('appointments').add(newAppointment);
    res.status(201).json({ id: docRef.id, message: 'Appointment created successfully' });
  } catch (error) {
    console.error('Error creating appointment:', error.message);
    res.status(500).json({ message: 'Failed to create appointment' });
  }
});

export default router;
