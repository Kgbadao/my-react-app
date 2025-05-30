// frontend/components/AppointmentForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

const AppointmentForm = () => {
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDoctor, setFormDoctor] = useState('');
  const [userId] = useState('user123'); // Hardcoded, later replace with actual auth user
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formDate || !formTime || !formDoctor) {
      setMessage('Please fill all fields');
      return;
    }

    const appointmentData = {
      date: formDate,
      time: formTime,
      doctor: formDoctor,
      userId,
    };

    try {
      setLoading(true);
      setMessage('');
      await axios.post('http://localhost:5000/api/appointments', appointmentData);
      setMessage('✅ Appointment created successfully!');
      setFormDate('');
      setFormTime('');
      setFormDoctor('');
    } catch (error) {
      console.error(error);
      setMessage('❌ Error creating appointment: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto' }}>
      <h2>Create Appointment</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Date:</label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Time:</label>
          <input
            type="time"
            value={formTime}
            onChange={(e) => setFormTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Doctor:</label>
          <input
            type="text"
            value={formDoctor}
            onChange={(e) => setFormDoctor(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Appointment'}
        </button>
      </form>

      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
};

export default AppointmentForm;
