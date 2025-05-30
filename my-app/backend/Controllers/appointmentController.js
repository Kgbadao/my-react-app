const appointments = []; // Fake database for appointments

// Create a new appointment
export const createAppointment = (req, res) => {
  const { date, time, doctor, userId } = req.body;

  if (!date || !time || !doctor || !userId) {
    return res.status(400).json({ message: 'Please provide all fields.' });
  }

  const newAppointment = { date, time, doctor, userId };
  appointments.push(newAppointment);
  res.status(201).json({ message: 'Appointment created successfully', appointment: newAppointment });
};

// Get all appointments (or filter by userId)
export const getAppointments = (req, res) => {
  const { userId } = req.query;

  if (userId) {
    const userAppointments = appointments.filter(app => app.userId === userId);
    return res.json(userAppointments);
  }

  res.json(appointments);
};
