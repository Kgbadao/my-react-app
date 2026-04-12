import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute
 *
 * Wraps any route that requires the user to be logged in.
 * If no auth token or user is found in localStorage, it redirects
 * to /login and remembers where the user was trying to go
 * (so after login they can be sent back there).
 *
 * Usage in your App.jsx / router:
 *
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 *   <Route path="/appointmentform" element={<ProtectedRoute><AppointmentForm /></ProtectedRoute>} />
 *   <Route path="/chat/:roomId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
 *   <Route path="/video-call" element={<ProtectedRoute><VideoCallComponent /></ProtectedRoute>} />
 *   <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();

  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');

  // If either the token or user data is missing, redirect to login
  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }} // remember where they came from
        replace
      />
    );
  }

  return children;
}