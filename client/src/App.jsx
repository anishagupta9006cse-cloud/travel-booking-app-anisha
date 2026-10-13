import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Search from './pages/Search.jsx';
import Auth from './pages/Auth.jsx';
import Book from './pages/Book.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Admin from './pages/Admin.jsx';
import EmergencyAlerts from './components/EmergencyAlerts.jsx';
import PatientEmergencyStatus from './components/PatientEmergencyStatus.jsx';
import { useCurrency } from './context/CurrencyContext.jsx';

function Protected({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  return (
    <>
      <nav className="nav">
        <Link to="/" className="brand">TravelBook</Link>
        <div className="row">
          {user && <Link to="/bookings">My Bookings</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', background:'#fff', color: '#000'}}
              >
                 <option value="INR">INR (₹)</option>
                 <option value="USD">USD ($)</option>
                 <option value="EUR">EUR (€)</option>

          </select>
           
          {user ? <button className="link" onClick={logout}>Logout ({user.name})</button> : <Link to="/login">Login</Link>}
        </div>
      </nav>
      <main className="container">
        {user?.isDoctor && <EmergencyAlerts />}
        {user && <PatientEmergencyStatus />}
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/book/:id" element={<Protected><Book /></Protected>} />
          <Route path="/bookings" element={<Protected><MyBookings /></Protected>} />
          <Route path="/admin" element={<Protected role="admin"><Admin /></Protected>} />
          <Route path="*" element={<p>Page not found</p>} />
        </Routes>
      </main>
    </>
  );
}
