import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo / Title */}
        <h1 className="text-2xl font-bold text-blue-700">TeleMed</h1>

        {/* Navigation Links */}
        <ul className="flex flex-row gap-6 items-center">
          <li>
            <Link to="/" className="nav-link">Home</Link>
          </li>
          <li>
            <Link to="/about" className="nav-link">About</Link>
          </li>
          <li>
            <Link to="/services" className="nav-link">Services</Link>
          </li>
          <li>
            <Link to="/contact" className="nav-link">Contact</Link>
          </li>
          <li>
            <Link to="/chat" className="nav-link">Chat</Link>
          </li>
          <li>
            <Link to="/login" className="btn-primary">Login</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
