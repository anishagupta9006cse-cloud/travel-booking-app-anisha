import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../auth.jsx';

export default function PatientEmergencyStatus() {
  const { user } = useAuth();
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('token') },
    });
    socket.on('emergency:accepted', (d) =>
      setMsg(`✅ ${d.doctorName}${d.verified ? ' (Verified medical professional)' : ''} is coming to help. ${d.disclaimer}`)
    );
    return () => socket.disconnect();
  }, [user?.id]);

  if (!msg) return null;
  return (
    <div className="card">
      <p className="notice">{msg}</p>
      <button className="link" onClick={() => setMsg('')}>Dismiss</button>
    </div>
  );
}