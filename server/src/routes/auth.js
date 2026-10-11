import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

const publicUser = (u) => ({
  id: u._id, name: u.name, email: u.email, role: u.role,
  isDoctor: u.isDoctor, doctorStatus: u.doctorStatus, emergencyOptIn: u.emergencyOptIn,
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  isDoctor: z.boolean().optional(),
  regNo: z.string().min(3).optional(),
  emergencyOptIn: z.boolean().optional(),
});

router.post('/register', asyncHandler(async (req, res) => {
  const d = registerSchema.parse(req.body);
  if (d.isDoctor && !d.regNo) return res.status(400).json({ error: 'Medical registration number required' });
  const user = await User.create({
    name: d.name,
    email: d.email,
    passwordHash: await bcrypt.hash(d.password, 10),
    isDoctor: !!d.isDoctor,
    doctorStatus: d.isDoctor ? 'pending' : 'none', // admin verify karega
    regNo: d.isDoctor ? d.regNo : undefined,
    emergencyOptIn: !!d.isDoctor && !!d.emergencyOptIn,
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

// Doctor kabhi bhi opt-out / opt-in kar sakta hai
router.patch('/me/emergency', requireAuth, asyncHandler(async (req, res) => {
  const { optIn } = z.object({ optIn: z.boolean() }).parse(req.body);
  if (!req.user.isDoctor) return res.status(400).json({ error: 'Only medical professionals can opt in' });
  req.user.emergencyOptIn = optIn;
  await req.user.save();
  res.json({ user: publicUser(req.user) });
}));

router.post('/me/doctor', requireAuth, asyncHandler(async (req, res) => {
  const { regNo, optIn } = z.object({ regNo: z.string().min(3), optIn: z.boolean() }).parse(req.body);
  req.user.isDoctor = true;
  if (['none', 'rejected'].includes(req.user.doctorStatus)) req.user.doctorStatus = 'pending';
  req.user.regNo = regNo;
  req.user.emergencyOptIn = optIn;
  await req.user.save();
  res.json({ user: publicUser(req.user) });
}));

export default router;
