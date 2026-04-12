import React, { useState } from 'react';
import axios from 'axios';
import { AlertCircle, Loader, UserPlus } from 'lucide-react';
import { auth } from '../firebaseConfig'; // Ensure this path is correct
import { signInWithCustomToken } from "firebase/auth";

const API_URL = import.meta.env.VITE_API_URL || 'https://telemed-seel.onrender.com';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Register the user on your Render backend
      const res = await axios.post(`${API_URL}/api/auth/register`, form);
      const data = res.data;

      if (data.token) {
        // 2. EXCHANGE the Custom Token from backend for a Firebase ID Token
        const userCredential = await signInWithCustomToken(auth, data.token);
        const idToken = await userCredential.user.getIdToken();

        // 3. SAVE to LocalStorage (matching LoginPage logic)
        localStorage.setItem('token', idToken); // Used for API verification
        localStorage.setItem('authToken', data.token); // Used for Socket.io
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('user', JSON.stringify({
          id: data.userId,
          name: data.name || form.name,
          email: data.email || form.email,
        }));

        // 4. Redirect to Dashboard
        console.log('✅ Registration & Login successful');
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-lg border border-white/20 shadow-xl rounded-3xl p-8">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-indigo-100 rounded-2xl">
              <UserPlus className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Create Account</h2>
          <p className="text-center text-gray-500 mb-8">Start your journey with TeleMed</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none"
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 font-semibold hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}