import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-[#1c2f54] text-white shadow-md py-4 px-6 sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo / Title */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <h1 className="text-2xl font-bold text-white">TeleMed</h1>
        </Link>

        {/* Navigation Links */}
        <ul className="flex space-x-4 items-center text-sm font-medium">
          <li>
            <Link to="/" className={`px-3 py-2 rounded-md transition ${isActive("/") ? "bg-blue-500 text-white" : "hover:text-blue-300"}`}>Home</Link>
          </li>
          <li>
            <Link to="/about" className={`px-3 py-2 rounded-md transition ${isActive("/about") ? "bg-blue-500 text-white" : "hover:text-blue-300"}`}>About</Link>
          </li>
          <li>
            <Link to="/dashboard" className={`px-3 py-2 rounded-md transition ${isActive("/dashboard") ? "bg-blue-500 text-white" : "hover:text-blue-300"}`}>Dashboard</Link>
          </li>
          <li>
            <Link to="/appointmentform" className={`px-3 py-2 rounded-md transition ${isActive("/appointmentform") ? "bg-blue-500 text-white" : "hover:text-blue-300"}`}>Appointment</Link>
          </li>
          <li>
            <Link to="/services" className={`px-3 py-2 rounded-md transition ${isActive("/services") ? "bg-blue-500 text-white" : "hover:text-blue-300"}`}>Services</Link>
          </li>
          <li>
            <Link to="/chat" className={`px-3 py-2 rounded-md transition ${isActive("/chat") ? "bg-blue-500 text-white" : "hover:text-blue-300"}`}>Chat</Link>
          </li>
          <li>
            <Link to="/doctorregistration" className={`px-3 py-2 rounded-md transition ${isActive("/doctorregistration") ? "bg-blue-500 text-white" : "hover:text-blue-300"}`}>Doctor</Link>
          </li>
          <li>
            <Link to="/register" className={`px-3 py-2 rounded-md transition ${isActive("/register") ? "bg-blue-500 text-white" : "hover:text-white-300"}`}>Register</Link>
          </li>
          <li>
            
            <Link to="/login" className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition font-semibold">
              Login
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
