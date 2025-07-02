import React, { useState } from 'react';
import axios from 'axios';

const doctors = [
  { id: 'doc1', name: 'Dr. Smith' },
  { id: 'doc2', name: 'Dr. Johnson' },
  { id: 'doc3', name: 'Dr. Lee' },
  // Add more doctors as needed with their IDs
];

const AppointmentForm = () => {
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDoctorId, setFormDoctorId] = useState('');
  const [userId] = useState('user123'); // replace with real logged-in user ID later
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formDate || !formTime || !formDoctorId) {
      setMessage('Please fill all fields');
      return;
    }

    const appointmentData = {
      date: formDate,
      time: formTime,
      doctorId: formDoctorId,
      patientId: userId,
    };

    try {
      setLoading(true);
      setMessage('');

      // Check for conflict before booking
      const checkRes = await axios.get('http://localhost:5000/api/appointments/check', {
        params: {
          date: formDate,
          time: formTime,
          doctorId: formDoctorId,
        },
      });

      if (checkRes.data.exists) {
        setMessage('❌ This time slot is already booked. Please choose another.');
        return;
      }

      await axios.post('http://localhost:5000/api/appointments', appointmentData);

      setMessage('✅ Appointment created successfully!');
      setFormDate('');
      setFormTime('');
      setFormDoctorId('');
    } catch (error) {
      console.error(error);
      setMessage('❌ ' + (error.response?.data?.message || 'Error creating appointment'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow-lg rounded-xl p-6">
      <h2 className="text-2xl font-semibold text-indigo-700 text-center mb-4">Create Appointment</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Time</label>
          <input
            type="time"
            value={formTime}
            onChange={(e) => setFormTime(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Doctor</label>
          <select
            value={formDoctorId}
            onChange={(e) => setFormDoctorId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          >
            <option value="" disabled>
              Select a doctor
            </option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 text-white font-medium rounded-lg transition ${
            loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Creating...' : 'Create Appointment'}
        </button>
      </form>

      {message && (
        <p
          className={`mt-4 text-center text-sm font-medium ${
            message.startsWith('✅') ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default AppointmentForm;
