import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

export default function PendingApproval() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Application Under Review</h1>
        <p className="text-gray-500 mb-2">
          Hi <span className="font-semibold text-gray-700">{user.name}</span>, your doctor registration has been submitted successfully.
        </p>
        <p className="text-gray-500 mb-8">
          We're reviewing your medical license. This usually takes 1–2 business days. You'll be able to access your dashboard once approved.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            navigate('/login');
          }}
          className="text-sm text-indigo-600 hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}