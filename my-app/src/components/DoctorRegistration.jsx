import React, { useState } from 'react';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

const DoctorRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialization: '',
    licenseNumber: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Upload License to Firebase Storage[cite: 3]
      if (!file) throw new Error("Please upload your medical license.");
      
      const storageRef = ref(storage, `licenses/${Date.now()}_${file.name}`);
      const uploadTask = await uploadBytes(storageRef, file);
      const licenseURL = await getDownloadURL(uploadTask.ref);

      // 2. Register via Backend API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'doctor',
          licenseURL,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Registration failed");

      // 3. Success - Store token and redirect[cite: 1, 11]
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify({ 
        name: formData.name, 
        role: 'doctor', 
        status: 'pending' 
      }));
      
      alert("Registration submitted! Your credentials are being verified.");
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center">Doctor Registration</h2>
      
      {error && <p className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" placeholder="Full Name" onChange={handleChange} required className="w-full p-2 border rounded" />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="w-full p-2 border rounded" />
        <input name="password" type="password" placeholder="Password (min 6 chars)" onChange={handleChange} required className="w-full p-2 border rounded" />
        <input name="specialization" placeholder="Specialization (e.g. Cardiologist)" onChange={handleChange} required className="w-full p-2 border rounded" />
        <input name="licenseNumber" placeholder="Medical License Number" onChange={handleChange} required className="w-full p-2 border rounded" />
        
        <div className="border-2 border-dashed p-4 text-center">
          <label className="block mb-2 text-sm font-medium">Upload Medical License (PDF/JPG)</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} required className="text-sm" />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Processing...' : 'Register as Doctor'}
        </button>

        {loading && (
          <p className="text-xs text-gray-500 text-center animate-pulse mt-2">
            Securely uploading documents. Please don't refresh...
          </p>
        )}
      </form>
    </div>
  );
};

export default DoctorRegistration;