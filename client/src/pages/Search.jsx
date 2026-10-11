 import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api.js';

export default function Search() {
  // 1. Filter state me 'origin' add kiya
  const [f, setF] = useState({ origin: '', destination: '', type: '', maxPrice: '', travelers: 1 });
  const [applied, setApplied] = useState(f);

  const { data, isLoading, error } = useQuery({
    queryKey: ['listings', applied],
    queryFn: () => api.get('/listings', { params: applied }).then((r) => r.data),
  });

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <h1>Find your next trip</h1>
      <form className="card row wrap" onSubmit={(e) => { e.preventDefault(); setApplied(f); }}>
        
        {/* 2. Kahan se (Origin) input field */}
        <input 
          placeholder="From (e.g. Delhi)" 
          value={f.origin} 
          onChange={set('origin')} 
        />

        {/* Kahan tak (Destination) input field */}
        <input 
          placeholder="To (e.g. Goa)" 
          value={f.destination} 
          onChange={set('destination')} 
        />

        <select value={f.type} onChange={set('type')}>
          <option value="">All</option>
          <option value="flight">Flights</option>
          <option value="train">Train</option>
          <option value="hotel">Hotels</option>
          <option value="package">Packages</option>
        </select>

        <input type="number" min="0" placeholder="Max price" value={f.maxPrice} onChange={set('maxPrice')} />
        <input type="number" min="1" max="10" value={f.travelers} onChange={set('travelers')} title="Travelers" />
        
        <button type="submit">Search</button>
      </form>

      {isLoading && <p className="muted">Searching...</p>}
      {error && <p className="error">Could not load results</p>}[span_0](start_span)[span_0](end_span)
      {data?.length === 0 && <p className="muted">No results. Try a different route or budget.</p>}

      <div className="grid">
        {data?.map((l) => (
          <div className="card" key={l._id}>
            <span className="tag">{l.type}</span>
            <h3>{l.title}</h3>
            
            {/* Origin aur Destination details display */}
            <p className="muted">
              {l.origin ? `${l.origin} ➔ ` : ''}{l.destination}
            </p>

            {l.description && <p>{l.description}</p>}
            <p><b>₹{l.price.toLocaleString('en-IN')}</b> / person · {l.inventory} left</p>
            
            {l.lat && (
              <a className="muted" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}#map=12/${l.lat}/${l.lng}`}>
                View on map
              </a>
            )}
            
            <div>
              <Link className="btn" to={`/book/${l._id}?travelers=${applied.travelers}`}>Book</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}