import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { errMsg } from '../api.js';

const empty = { type: 'hotel', title: '', destination: '', price: '', inventory: '' };

export default function Admin() {
  const qc = useQueryClient();
  const [f, setF] = useState(empty);
  const [err, setErr] = useState('');
  const refresh = () => qc.invalidateQueries();

  const stats = useQuery({ queryKey: ['stats'], queryFn: () => api.get('/admin/stats').then((r) => r.data) });
  const bookings = useQuery({ queryKey: ['abookings'], queryFn: () => api.get('/admin/bookings').then((r) => r.data) });
  const listings = useQuery({ queryKey: ['alistings'], queryFn: () => api.get('/listings').then((r) => r.data) });
  const doctors = useQuery({ queryKey: ['doctors'], queryFn: () => api.get('/admin/doctors/pending').then((r) => r.data) });

  const act = useMutation({ mutationFn: (fn) => fn(), onSuccess: refresh, onError: (e) => setErr(errMsg(e)) });

  const addListing = (e) => {
    e.preventDefault(); setErr('');
    act.mutate(() => api.post('/admin/listings', { ...f, price: Number(f.price), inventory: Number(f.inventory) }).then(() => setF(empty)));
  };

  return (
    <>
      <h1>Admin dashboard</h1>
      {err && <p className="error">{err}</p>}
      {stats.data && (
        <div className="grid">
          <div className="card"><h3>{stats.data.bookings}</h3><p className="muted">Total bookings</p></div>
          <div className="card"><h3>{stats.data.confirmed}</h3><p className="muted">Confirmed</p></div>
          <div className="card"><h3>₹{stats.data.revenue.toLocaleString('en-IN')}</h3><p className="muted">Revenue</p></div>
        </div>
      )}

      <h2>Doctor verification</h2>
      {doctors.data?.length === 0 && <p className="muted">No pending requests.</p>}
      {doctors.data?.map((d) => (
        <div className="card row between" key={d._id}>
          <span>{d.name} · {d.email} · Reg: {d.regNo}</span>
          <span className="row">
            <button onClick={() => act.mutate(() => api.post(`/admin/doctors/${d._id}/verify`, { approve: true }))}>Approve</button>
            <button className="secondary" onClick={() => act.mutate(() => api.post(`/admin/doctors/${d._id}/verify`, { approve: false }))}>Reject</button>
          </span>
        </div>
      ))}

      <h2>Inventory</h2>
      <form className="card row wrap" onSubmit={addListing}>
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option>flight</option><option>hotel</option><option>package</option></select>
        <input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
        <input placeholder="Destination" value={f.destination} onChange={(e) => setF({ ...f, destination: e.target.value })} required />
        <input type="number" placeholder="Price" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required />
        <input type="number" placeholder="Inventory" value={f.inventory} onChange={(e) => setF({ ...f, inventory: e.target.value })} required />
        <button>Add</button>
      </form>
      {listings.data?.map((l) => (
        <div className="card row between" key={l._id}>
          <span>{l.type} · {l.title} · ₹{l.price} · {l.inventory} left</span>
          <button className="secondary" onClick={() => window.confirm('Delete listing?') && act.mutate(() => api.delete(`/admin/listings/${l._id}`))}>Delete</button>
        </div>
      ))}

      <h2>Bookings</h2>
      {bookings.data?.map((b) => (
        <div className="card row between" key={b._id}>
          <span>{b.code} · {b.user?.name} · {b.listing?.title} · ₹{b.amount} · <span className={`badge ${b.status}`}>{b.status}</span></span>
          {b.status === 'REFUND_PENDING' && <button onClick={() => act.mutate(() => api.post(`/admin/bookings/${b._id}/refund`))}>Mark refunded</button>}
        </div>
      ))}
    </>
  );
}
