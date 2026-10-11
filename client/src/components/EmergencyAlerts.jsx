import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api, { errMsg } from '../api.js';
import { useAuth } from '../auth.jsx';

// Sirf verified + opted-in doctors ko alerts dikhte hain
export default function EmergencyAlerts() {
  const { user, setUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [msg, setMsg] = useState('');
  const active = user.doctorStatus === 'verified' && user.emergencyOptIn;

  useEffect(() => {
    if (!active) return;
    api.get('/emergency/open').then((r) => setAlerts(r.data.map((a) => ({ id: a._id, coach: a.coach || 'Not specified', note: a.note })))).catch(() => {});
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', { auth: { token: localStorage.getItem('token') } });
    socket.on('emergency:new', (a) => setAlerts((prev) => [a, ...prev.filter((x) => x.id !== a.id)]));
    return () => socket.disconnect();
  }, [active]);

  const accept = async (id) => {
    try {
      await api.post(`/emergency/${id}/accept`);
      setAlerts((p) => p.filter((a) => a.id !== id));
      setMsg('Thank you. Basic assistance dein jab tak emergency services na pahunch jayein. 112 par call zaroor karein.');
    } catch (e) { setMsg(errMsg(e)); setAlerts((p) => p.filter((a) => a.id !== id)); }
  };

  const toggle = async () => {
    const { data } = await api.patch('/auth/me/emergency', { optIn: !user.emergencyOptIn });
    setUser(data.user);
  };

  return (
    <div className="card">
      <div className="row between">
        <b>🩺 Medical volunteer {user.doctorStatus === 'verified' ? '(Verified)' : `(${user.doctorStatus})`}</b>
        <button className="link" onClick={toggle}>{user.emergencyOptIn ? 'Opt out' : 'Opt in'}</button>
      </div>
      {msg && <p className="notice">{msg}</p>}
      {alerts.map((a) => (
        <div className="alert" key={a.id}>
          🚨 Emergency near <b>{a.coach}</b>{a.note ? ` · "${a.note}"` : ''}
          <button className="danger" onClick={() => accept(a.id)}>Accept & help</button>
        </div>
      ))}
    </div>
  );
}
