import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import HomePage from "./pages/HomePage"
import VideoCallComponent from "./components/VideoCallComponent"
import Chat from "./components/Chat"
import LoginPage from "./pages/LoginPage"
import AboutPage from "./pages/AboutPage"
import ServicesPage from "./pages/ServicesPage"
import ContactPage from "./pages/ContactPage"
import AppointmentForm from "./components/AppointmentForm"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import DoctorRegistration from "./components/DoctorRegistration"
import "./index.css" // Make sure to import your CSS

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Horizontal Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/video-call" element={<VideoCallComponent />} />
          <Route path="/chat/:roomId" element={<Chat />} />
          <Route path="/contactpage" element={<ContactPage />} />
          <Route path="/appointmentform" element={<AppointmentForm />} />
          <Route path="/doctorregistration" element={<DoctorRegistration />} />
          <Route path="/register" element={<Register />} />
           <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  )
}
