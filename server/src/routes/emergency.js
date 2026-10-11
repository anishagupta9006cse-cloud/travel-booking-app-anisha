import { Router } from 'express';
import { z } from 'zod';
import Booking from '../models/Booking.js';
import Emergency from '../models/Emergency.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { notifyUser } from '../socket.js';
import { STATUS } from '../utils/bookingState.js';

const router = Router();
router.use(requireAuth);

const DISCLAIMER = 'Yeh feature emergency services ka replacement nahi hai. Turant 112 par call karein.';

// Patient: Emergency alert raise karta hai
router.post('/', asyncHandler(async (req, res) => {
  const { bookingId, note } = z.object({ bookingId: z.string(), note: z.string().max(300).optional() }).parse(req.body);
  const booking = await Booking.findOne({ _id: bookingId, user: req.user._id, status: STATUS.CONFIRMED });
  if (!booking) return res.status(404).json({ error: 'Active confirmed booking required' });

  // Same trip (listing + date) par confirmed bookings
  const sameTrip = await Booking.find({
    listing: booking.listing, startDate: booking.startDate,
    status: STATUS.CONFIRMED, user: { $ne: req.user._id },
  }).populate('user');

  const doctors = sameTrip
    .filter((b) => b.user.isDoctor && b.user.doctorStatus === 'verified' && b.user.emergencyOptIn)
    .sort((a, b) => (b.coach === booking.coach) - (a.coach === booking.coach)); // same coach pehle

  const alert = await Emergency.create({
    patient: req.user._id, booking: booking._id, coach: booking.coach, note,
    notified: doctors.map((d) => d.user._id), log: [{ event: 'raised' }],
  });

  // Doctors ko LIMITED info: coach + note. Naam/phone nahi.
  doctors.forEach((d) => notifyUser(d.user._id, 'emergency:new', {
    id: alert._id, coach: alert.coach || 'Not specified', note: alert.note || '', raisedAt: alert.createdAt,
  }));

  res.status(201).json({ alert, doctorsNotified: doctors.length, disclaimer: DISCLAIMER });
}));

// Doctor: open alerts jo unhe bheje gaye
router.get('/open', asyncHandler(async (req, res) => {
  const alerts = await Emergency.find({ notified: req.user._id, status: 'OPEN' }).select('coach note createdAt');
  res.json(alerts);
}));

router.post('/:id/accept', asyncHandler(async (req, res) => {
  const alert = await Emergency.findOneAndUpdate(
    { _id: req.params.id, notified: req.user._id, status: 'OPEN' },
    { status: 'ACCEPTED', responder: req.user._id, $push: { log: { event: 'accepted' } } },
    { new: true },
  );
  if (!alert) return res.status(409).json({ error: 'Alert already taken or not available' });
  notifyUser(alert.patient, 'emergency:accepted', {
    id: alert._id, doctorName: req.user.name, verified: true, disclaimer: DISCLAIMER,
  });
  res.json({ alert });
}));

router.post('/:id/resolve', asyncHandler(async (req, res) => {
  const alert = await Emergency.findById(req.params.id);
  const uid = String(req.user._id);
  if (!alert || ![String(alert.patient), String(alert.responder)].includes(uid)) {
    return res.status(404).json({ error: 'Not found' });
  }
  alert.status = 'RESOLVED';
  alert.log.push({ event: 'resolved' });
  await alert.save();
  res.json({ alert });
}));

export default router;
