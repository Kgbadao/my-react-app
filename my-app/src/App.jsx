import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import VideoCallComponent from "./components/VideoCallComponent";
import Chat from "./components/Chat";
import LoginPage from "./pages/LoginPage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
import AppointmentForm from "./components/AppointmentForm";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DoctorRegistration from "./components/DoctorRegistration";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import "./index.css";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contactpage" element={<ContactPage />} />
          <Route path="/video-call" element={<VideoCallComponent />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:roomId" element={<Chat />} />
          <Route path="/appointmentform" element={<AppointmentForm />} />
          <Route path="/doctorregistration" element={<DoctorRegistration />} />

          {/* 👇 Public Routes (only accessible if NOT logged in) */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />

          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />

          {/* 👇 Private Routes (only accessible if logged in) */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}
