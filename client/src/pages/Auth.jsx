import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', isDoctor: false, regNo: '', emergencyOptIn: true });
  const [err, setErr] = useState('');
  const { saveSession } = useAuth();
  const nav = useNavigate();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const body = mode === 'login' ? { email: f.email, password: f.password } : { ...f, regNo: f.isDoctor ? f.regNo : undefined };
      const { data } = await api.post(`/auth/${mode}`, body);
      saveSession(data);
      nav('/');
    } catch (e2) { setErr(errMsg(e2)); }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Login' : 'Create account'}</h2>
      {mode === 'register' && <input placeholder="Full name" value={f.name} onChange={set('name')} required />}
      <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      <input type="password" placeholder="Password (min 6)" value={f.password} onChange={set('password')} required />

      {mode === 'register' && (
        <>
          <label className="check"><input type="checkbox" checked={f.isDoctor} onChange={set('isDoctor')} /> I am a Doctor / Medical Professional (optional)</label>
          {f.isDoctor && (
            <>
              <input placeholder="Medical registration number" value={f.regNo} onChange={set('regNo')} required />
              <label className="check"><input type="checkbox" checked={f.emergencyOptIn} onChange={set('emergencyOptIn')} /> I volunteer to help in emergencies during travel (can opt out anytime)</label>
              <p className="muted">Badge milne se pehle admin aapki registration verify karega.</p>
            </>
          )}
        </>
      )}
      {err && <p className="error">{err}</p>}
      <button>{mode === 'login' ? 'Login' : 'Register'}</button>
      <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'New here? Register' : 'Have an account? Login'}
      </button>
    </form>
  );
}
