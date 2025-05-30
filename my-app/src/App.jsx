import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import VideoCallComponent from "./components/VideoCallComponent";
import Chat from "./components/Chat";
import LoginPage from "./pages/LoginPage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";

export default function App() {
  return (
    <div className="h-screen flex flex-col">
      {/* Horizontal Navbar */}
      <Navbar />

      {/* Main Content (Ensuring It Doesn’t Clash) */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/videocall-component" element={<VideoCallComponent />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>
    </div>
  );
}
