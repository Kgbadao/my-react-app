import React from "react";
import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 text-gray-800">
      {/* Hero Section */}
      <section className="text-center py-24 px-6">
        <h1 className="text-5xl font-extrabold mb-4 text-blue-700">Welcome to <span className="text-blue-500">TeleMed</span></h1>
        <p className="text-lg mb-8 max-w-2xl mx-auto">
          Your trusted platform for secure, reliable telemedicine services available anytime, anywhere.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/videocall-component" className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition">
            Start Video Call
          </Link>
          <Link to="/chat" className="bg-white text-blue-700 border border-blue-600 px-6 py-3 rounded-lg shadow hover:bg-blue-100 transition">
            Message Now
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <h2 className="text-4xl font-bold text-center mb-12">Why Choose <span className="text-blue-600">TeleMed</span>?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {["Secure Video Calls", "Instant Messaging", "Easy Booking"].map((title, i) => (
            <div key={i} className="bg-blue-50 p-6 rounded-xl shadow hover:shadow-xl transition">
              <h3 className="text-xl font-semibold mb-2 text-blue-700">{title}</h3>
              <p className="text-gray-600">
                {title === "Secure Video Calls" && "Encrypted consultations from anywhere with peace of mind."}
                {title === "Instant Messaging" && "Connect with doctors instantly and securely."}
                {title === "Easy Booking" && "Book appointments with just a few clicks."}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-700 text-white text-center py-6">
        <p>&copy; {new Date().getFullYear()} TeleMed. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default HomePage;
