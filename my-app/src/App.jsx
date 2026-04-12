/**
 * App.jsx — Example routing setup
 *
 * This shows how to plug in ProtectedRoute and the updated VideoCallComponent.
 * Replace your existing App.jsx routes section with this pattern.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';           // updated Navbar
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';      // updated ContactPage
import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AppointmentForm from './pages/AppointmentForm';
import Chat from './pages/Chat';
import VideoCallComponent from './pages/VideoCallComponent'; // updated VideoCall
import Profile from './pages/Profile';              // updated Profile
import DoctorRegistration from './pages/DoctorRegistration';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>

        {/* ─── Public routes (anyone can visit) ─── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctorregistration" element={<DoctorRegistration />} />

        {/* ─── Protected routes (must be logged in) ─── */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/appointmentform"
          element={<ProtectedRoute><AppointmentForm /></ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute><Profile /></ProtectedRoute>}
        />

        {/*
          Chat now requires an appointmentId in the URL.
          This matches what your Dashboard already does:
            navigate(`/chat/${appt.id}`)
        */}
        <Route
          path="/chat/:roomId"
          element={<ProtectedRoute><Chat /></ProtectedRoute>}
        />

        {/*
          Video call has TWO routes:
          1. /video-call/:appointmentId  — launched from an appointment card (auto-connects)
          2. /video-call                 — manual fallback (shows peer ID copy/paste UI)
        */}
        <Route
          path="/video-call/:appointmentId"
          element={<ProtectedRoute><VideoCallComponent /></ProtectedRoute>}
        />
        <Route
          path="/video-call"
          element={<ProtectedRoute><VideoCallComponent /></ProtectedRoute>}
        />

      </Routes>
    </BrowserRouter>
  );
}