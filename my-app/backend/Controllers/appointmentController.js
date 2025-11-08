const appointments = []; // Fake database for appointments

// Check if appointment slot is available
export const checkAppointment = (req, res) => {
  const { date, time, doctorId } = req.query;

  if (!date || !time || !doctorId) {
    return res.status(400).json({ message: 'Date, time, and doctorId are required' });
  }

  // Check if slot already exists
  const exists = appointments.some(
    apt => apt.date === date && apt.time === time && apt.doctorId === doctorId
  );

  res.json({ exists });
};

// Create a new appointment
export const createAppointment = (req, res) => {
  const { date, time, doctorId, patientId, notes } = req.body;

  if (!date || !time || !doctorId || !patientId) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  // Double-check availability before creating
  const exists = appointments.some(
    apt => apt.date === date && apt.time === time && apt.doctorId === doctorId
  );

  if (exists) {
    return res.status(409).json({ message: 'This time slot is already booked' });
  }

  const newAppointment = {
    id: Date.now().toString(), // Simple ID generation
    date,
    time,
    doctorId,
    patientId,
    notes: notes || '',
    status: 'scheduled',
    createdAt: new Date()
  };

  appointments.push(newAppointment);
  res.status(201).json({
    message: 'Appointment created successfully',
    appointment: newAppointment
  });
};

// Get all appointments (or filter by patientId or doctorId)
export const getAppointments = (req, res) => {
  const { patientId, doctorId } = req.query;

  if (patientId) {
    const userAppointments = appointments.filter(app => app.patientId === patientId);
    return res.json(userAppointments);
  }

  if (doctorId) {
    const doctorAppointments = appointments.filter(app => app.doctorId === doctorId);
    return res.json(doctorAppointments);
  }

  res.json(appointments);
};