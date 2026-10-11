import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { errMsg } from '../api.js';
import { downloadTicket } from '../utils/ticket.js';

const loadRazorpay = () => new Promise((res) => {
  if (window.Razorpay) return res(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => res(true); s.onerror = () => res(false);
  document.body.appendChild(s);
});

export default function Book() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [travelers, setTravelers] = useState(Number(sp.get('travelers')) || 1);
  const [startDate, setStartDate] = useState('');
  const [coach, setCoach] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);

  const { data: l, isLoading } = useQuery({ queryKey: ['listing', id], queryFn: () => api.get(`/listings/${id}`).then((r) => r.data) });
  if (isLoading) return <p className="muted">Loading...</p>;
  if (!l) return <p className="error">Listing not found</p>;

  async function verify(bookingId, p) {
    const { data } = await api.post('/payments/verify', { bookingId, ...p });
    setDone(data.booking);
  }

  async function payNow(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const { data: booking } = await api.post('/bookings', { listingId: id, travelers: Number(travelers), startDate, coach: coach || undefined });
      const { data: order } = await api.post('/payments/create-order', { bookingId: booking._id });

      if (order.mock) {
        // Sandbox/mock mode: gateway keys nahi hain
        await verify(booking._id, { orderId: order.orderId, paymentId: 'mock_pay', signature: 'mock' });
      } else {
        if (!(await loadRazorpay())) throw new Error('Could not load payment gateway');
        new window.Razorpay({
          key: order.keyId, amount: order.amount * 100, currency: order.currency, order_id: order.orderId, name: 'TravelBook',
          handler: (r) => verify(booking._id, { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }).catch((x) => setErr(errMsg(x))),
        }).open();
      }
    } catch (e2) { setErr(errMsg(e2)); }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="card narrow">
        <h2>Booking confirmed ✅</h2>
        <p>Booking ID: <b>{done.code}</b></p>
        <p>Amount paid: ₹{done.amount.toLocaleString('en-IN')}</p>
        <button onClick={() => downloadTicket({ ...done, listing: l })}>⬇ Download ticket</button>
        <button onClick={() => nav('/bookings')}>View my bookings</button>
      </div>
    );
  }

  return (
    <form className="card narrow" onSubmit={payNow}>
      <h2>{l.title}</h2>
      <p className="muted">{l.destination}</p>
      <label>Travel date<input type="date" required min={new Date().toISOString().slice(0, 10)} value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
      <label>Travelers<input type="number" min="1" max="10" value={travelers} onChange={(e) => setTravelers(e.target.value)} /></label>
      <label>Coach / seat area (optional)<input placeholder="e.g. B2" maxLength="20" value={coach} onChange={(e) => setCoach(e.target.value)} /></label>
      <p>Estimated total: <b>₹{(l.price * travelers).toLocaleString('en-IN')}</b> <span className="muted">(final price server calculate karta hai)</span></p>
      {err && <p className="error">{err}</p>}
      <button disabled={busy}>{busy ? 'Processing...' : 'Pay & Confirm'}</button>
    </form>
  );
}
