import express from 'express';
import { createAppointment, getAppointments, checkAppointment } from '../Controllers/appointmentController.js';

const router = express.Router();

// Check appointment availability
router.get('/check', checkAppointment);

// Get appointments
router.get('/', getAppointments);

// Create appointment
router.post('/', createAppointment);

export default router;