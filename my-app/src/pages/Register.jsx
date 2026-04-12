import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { AlertCircle, Loader, UserPlus } from 'lucide-react';
import { auth } from '../firebaseConfig'; 
import { signInWithCustomToken } from "firebase/auth";

const API_URL = import.meta.env.VITE_API_URL || 'https://telemed-seel.onrender.com';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Common function to handle the token exchange and redirect
  const handleAuthSuccess = async (backendData) => {
    try {
      const userCredential = await signInWithCustomToken(auth, backendData.token);
      const idToken = await userCredential.user.getIdToken();

      localStorage.setItem('token', idToken);
      localStorage.setItem('authToken', backendData.token);
      localStorage.setItem('userId', backendData.userId);
      localStorage.setItem('user', JSON.stringify({
        id: backendData.userId,
        name: backendData.name,
        email: backendData.email,
        picture: backendData.picture || null
      }));

      window.location.href = '/dashboard';
    } catch (err) {
      console.error("Firebase Exchange Error:", err);
      setError("Failed to sync with security service. Please try again.");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, form);
      await handleAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/google`, {
        token: credentialResponse.credential
      });
      await handleAuthSuccess(res.data);
    } catch (err) {
      setError('Google registration failed');
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

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition outline-none"
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition outline-none"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Sign Up'}
            </button>
          </form>

          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => setError('Google Registration Failed')}
              text="signup_with"
            />
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 font-semibold hover:underline">Log in</a>
          </p>
        </div>
      </div>
    </div>
  );
}