import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, ExternalLink } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://telemed-seel.onrender.com';
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

export default function AdminApproval() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);

  const fetchPending = async () => {
    const res = await axios.get(`${API_URL}/api/admin/pending-doctors`, {
      headers: { 'x-admin-secret': ADMIN_SECRET }
    });
    setDoctors(res.data);
    setLoading(false);
  };

  useEffect(() => { if (authed) fetchPending(); }, [authed]);

  const approve = async (userId) => {
    await axios.post(`${API_URL}/api/admin/approve-doctor/${userId}`, {}, {
      headers: { 'x-admin-secret': ADMIN_SECRET }
    });
    setDoctors(doctors.filter(d => d.id !== userId));
  };

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Admin Access</h2>
        <input
          type="password" placeholder="Admin password"
          value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => { if (password === ADMIN_SECRET) setAuthed(true); }}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
        >
          Enter
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Pending Doctor Approvals</h1>
      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && doctors.length === 0 && (
        <p className="text-gray-500">No pending doctors.</p>
      )}
      <div className="grid gap-4 max-w-3xl">
        {doctors.map(doc => (
          <div key={doc.id} className="bg-white rounded-2xl shadow p-6 flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-gray-800 text-lg">{doc.name}</p>
              <p className="text-gray-500 text-sm">{doc.email}</p>
              <p className="text-gray-600 text-sm mt-1">Specialty: {doc.specialization}</p>
              <p className="text-gray-600 text-sm">License #: {doc.licenseNumber}</p>
              {doc.licenseURL && (
                <a href={doc.licenseURL} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 text-sm mt-2 hover:underline">
                  View License <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <button
              onClick={() => approve(doc.id)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition text-sm font-semibold shrink-0"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}