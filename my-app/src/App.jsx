import { Routes, Route } from 'react-router-dom'; // 👈 REMOVED BrowserRouter from here
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AppointmentForm from './components/AppointmentForm';
import Chat from './components/Chat';
import VideoCallComponent from './components/VideoCallComponent';
import Profile from './pages/Profile';
import DoctorRegistration from './components/DoctorRegistration';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ❌ NO <BrowserRouter> TAG HERE */}
      <Navbar />
      <div className="flex-1 overflow-y-auto">
        <Routes>

          {/* ─── Public routes ─── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctorregistration" element={<DoctorRegistration />} />

          {/* ─── Protected routes ─── */}
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

          {/* Chat Route */}
          <Route
            path="/chat/:roomId"
            element={<ProtectedRoute><Chat /></ProtectedRoute>}
          />

          {/* Video Call Routes */}
          <Route
            path="/video-call/:appointmentId"
            element={<ProtectedRoute><VideoCallComponent /></ProtectedRoute>}
          />
          <Route
            path="/video-call"
            element={<ProtectedRoute><VideoCallComponent /></ProtectedRoute>}
          />

          {/* ─── The Missing Notifications Route ─── */}
          <Route 
            path="/notifications" 
            element={<ProtectedRoute><div className="p-20 text-center text-2xl font-bold">Notifications Coming Soon!</div></ProtectedRoute>} 
          />

        </Routes>
      </div>
      {/* ❌ NO </BrowserRouter> TAG HERE */}
    </div>
  );
}