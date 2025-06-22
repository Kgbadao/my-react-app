import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🧠 Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/appointments', {
        withCredentials: true,
      });
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Dashboard request failed:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.warn('Logout failed:', err);
    } finally {
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700">📋 TeleMed Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition"
        >
          Logout
        </button>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="text-center text-gray-500 mt-20">Fetching your appointments...</div>
      )}

      {error && (
        <div className="text-center text-red-600 mt-20">{error}</div>
      )}

      {/* Appointments Grid */}
      {!loading && !error && (
        <>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Upcoming Appointments ({appointments.length})
          </h2>
          {appointments.length === 0 ? (
            <p className="text-gray-600 text-center mt-10">No appointments to show yet.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-6 bg-white shadow-md rounded-xl border border-gray-100 hover:shadow-xl transition"
                >
                  <div className="mb-2">
                    <p className="text-gray-700 text-sm">Doctor</p>
                    <p className="text-indigo-700 font-semibold">{appt.doctorId}</p>
                  </div>
                  <div className="mb-2">
                    <p className="text-gray-700 text-sm">Patient</p>
                    <p className="text-indigo-700 font-semibold">{appt.patientId}</p>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-4">
                    <span>{appt.date}</span>
                    <span>{appt.time}</span>
                  </div>
                  {appt.notes && (
                    <div className="mt-4 text-sm text-gray-500 italic">📝 {appt.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
