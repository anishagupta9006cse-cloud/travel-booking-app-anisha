import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { errMsg } from '../api.js';
import { downloadTicket } from '../utils/ticket.js';

export default function MyBookings() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState('');
  const { data, isLoading, error } = useQuery({ queryKey: ['mine'], queryFn: () => api.get('/bookings/mine').then((r) => r.data) });

  const cancel = useMutation({
    mutationFn: (id) => api.post(`/bookings/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mine'] }),
    onError: (e) => setMsg(errMsg(e)),
  });

  
  async function emergency(id) {
    const note = window.prompt('Briefly describe the emergency (optional):') ?? '';
    try {
      const { data: r } = await api.post('/emergency', { bookingId: id, note });
      setMsg(`${r.doctorsNotified} nearby doctor(s) alerted. ${r.disclaimer}`);
    } catch (e) { setMsg(errMsg(e)); }
  }

  if (isLoading) return <p className="muted">Loading...</p>;
  if (error) return <p className="error">Could not load bookings</p>;

  return (
    <>
      <h1>My bookings</h1>
      {msg && <p className="notice">{msg}</p>}
      {data.length === 0 && <p className="muted">No bookings yet.</p>}
      {data.map((b) => (
        <div className="card" key={b._id}>
          <div className="row between">
            <h3>{b.listing?.title}</h3>
            <span className={`badge ${b.status}`}>{b.status}</span>
          </div>
          <p className="muted">ID {b.code} · {new Date(b.startDate).toDateString()} · {b.travelers} traveler(s) · ₹{b.amount.toLocaleString('en-IN')}</p>
          <div className="row">
            {['DRAFT', 'PAYMENT_PENDING', 'PAYMENT_FAILED', 'CONFIRMED'].includes(b.status) && (
              <button className="secondary" onClick={() => window.confirm('Cancel this booking?') && cancel.mutate(b._id)}>Cancel</button>
            )}
            {b.status === 'CONFIRMED' && <button onClick={() => downloadTicket(b)}>⬇ Download ticket</button>}

            {b.status === 'CONFIRMED' && <button className="danger" onClick={() => emergency(b._id)}>🚑 Emergency Medical Alert</button>}
          </div>
        </div>
      ))}
    </>
  );
}
