import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, Video, MessageCircle, Calendar, Home, Info, LogOut } from "lucide-react";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Read user from localStorage on every route change
  useEffect(() => {
    const stored = localStorage.getItem("user");
    setUser(stored ? JSON.parse(stored) : null);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    setUser(null);
    navigate("/");
  };

  // Links shown to everyone (logged in or not)
  const publicLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/about", label: "About", icon: Info },
  ];

  // Links only shown when logged in
  const privateLinks = [
    { to: "/dashboard", label: "Dashboard", icon: Calendar },
    { to: "/appointmentform", label: "Book", icon: Calendar },
    { to: "/video-call", label: "Video Call", icon: Video },
  ];

  const navLinks = user ? [...publicLinks, ...privateLinks] : publicLinks;

  return (
    <nav className="bg-[#1c2f54] text-white shadow-lg py-4 px-6 sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3" onClick={() => setMenuOpen(false)}>
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">TeleMed</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex space-x-1 items-center text-sm font-medium">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`px-3 py-2 rounded-md transition ${
                  isActive(to) ? "bg-blue-500 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}

          {/* Show chat only when logged in */}
          {user && (
            <li>
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md transition flex items-center gap-1 ${
                  isActive("/chat") ? "bg-blue-500 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <MessageCircle className="w-4 h-4" /> Chat
              </Link>
            </li>
          )}

          {/* Auth section */}
          {user ? (
            <li className="flex items-center gap-2 ml-3 pl-3 border-l border-white/20">
              {/* User avatar + name */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-sm text-gray-300 hidden lg:block">{user.name?.split(" ")[0]}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-2 rounded-md text-red-300 hover:text-white hover:bg-red-600/50 transition text-sm"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:block">Logout</span>
              </button>
            </li>
          ) : (
            <li className="flex items-center gap-2 ml-3">
              <Link
                to="/register"
                className="px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition font-semibold shadow"
              >
                Login
              </Link>
            </li>
          )}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-white/10 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 border-t border-white/10 pt-3 pb-2 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition ${
                isActive(to) ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}

          {user && (
            <Link
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </Link>
          )}

          <div className="border-t border-white/10 pt-3 mt-2">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-red-300 hover:bg-red-600/30 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-4">
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center px-4 py-3 rounded-md border border-white/20 text-white hover:bg-white/10 transition"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition font-semibold"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;