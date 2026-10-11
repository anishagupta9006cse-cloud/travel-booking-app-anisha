import { createContext, useContext, useEffect, useState } from 'react';
import api from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) return setLoading(false);
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user }) => { localStorage.setItem('token', token); setUser(user); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  return <Ctx.Provider value={{ user, setUser, loading, saveSession, logout }}>{children}</Ctx.Provider>;
}
