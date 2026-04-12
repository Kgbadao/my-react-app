import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AlertCircle, Loader } from 'lucide-react';
import { auth } from '../firebaseConfig'; // ✅ Corrected to match your file name
import { signInWithCustomToken } from "firebase/auth"; // ✅ FIXED: Must be from firebase/auth, not config

const API_URL = import.meta.env.VITE_API_URL || 'https://telemed-seel.onrender.com';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { name, email, password } : { email, password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        // 1. EXCHANGE CUSTOM TOKEN FOR ID TOKEN
        const userCredential = await signInWithCustomToken(auth, data.token);
        const idToken = await userCredential.user.getIdToken();

        // 2. SAVE EVERYTHING TO LOCALSTORAGE
        localStorage.setItem('token', idToken); // Used by backend verifyIdToken
        localStorage.setItem('authToken', data.token); // Kept for Socket.io
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('user', JSON.stringify({
          id: data.userId,
          name: data.name || name,
          email: data.email,
          provider: 'email'
        }));

        console.log('✅ Login successful');
        window.location.href = '/dashboard';
      } else {
        setError(data.error || data.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setError('Google credential missing');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        // Google flow also needs to exchange for ID Token if backend sends Custom Token
        const userCredential = await signInWithCustomToken(auth, data.token);
        const idToken = await userCredential.user.getIdToken();

        localStorage.setItem('token', idToken);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.userId,
          name: data.name,
          email: data.email,
          picture: data.picture || null,
          provider: 'google'
        }));

        window.location.href = '/dashboard';
      } else {
        setError(data.message || 'Google login failed');
      }
    } catch (err) {
      setError('Network error during Google login');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginFailure = () => setError('Google login was cancelled or failed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-md border border-white/30 shadow-2xl rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-center text-indigo-700 mb-2">
            {isRegister ? 'Create Account' : 'Login to TeleMed'}
          </h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleFormSubmit}>
            {isRegister && (
              <input
                type="text" placeholder="Full Name" value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required={isRegister} disabled={loading}
              />
            )}
            <input
              type="email" placeholder="Email Address" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required disabled={loading}
            />
            <input
              type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required disabled={loading}
            />
            
            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition shadow-md font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : (isRegister ? 'Create Account' : 'Login')}
            </button>

            <button
              type="button" onClick={() => { setIsRegister(!isRegister); setError(null); }}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
          </form>

          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="text-xs text-gray-500 font-medium">OR</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginFailure} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;