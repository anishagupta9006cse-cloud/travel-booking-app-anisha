import { Router } from 'express';
import { z } from 'zod';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { STATUS } from '../utils/bookingState.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

const listingSchema = z.object({
  type: z.enum(['flight', 'hotel', 'package']),
  title: z.string().min(2),
  destination: z.string().min(2),
  origin: z.string().optional(),
  price: z.number().min(0),
  inventory: z.number().int().min(0),
  description: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

router.post('/listings', asyncHandler(async (req, res) => res.status(201).json(await Listing.create(listingSchema.parse(req.body)))));
router.put('/listings/:id', asyncHandler(async (req, res) =>
  res.json(await Listing.findByIdAndUpdate(req.params.id, listingSchema.partial().parse(req.body), { new: true }))));
router.delete('/listings/:id', asyncHandler(async (req, res) => { await Listing.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));

router.get('/bookings', asyncHandler(async (_req, res) =>
  res.json(await Booking.find().populate('listing user', 'title name email').sort({ createdAt: -1 }).limit(200))));

router.post('/bookings/:id/refund', asyncHandler(async (req, res) => {
  const b = await Booking.findById(req.params.id);
  if (!b) return res.status(404).json({ error: 'Not found' });
  await b.moveTo(STATUS.REFUNDED, 'refund completed by admin');
  res.json(b);
}));

router.get('/stats', asyncHandler(async (_req, res) => {
  const [bookings, confirmed, revenueAgg] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: STATUS.CONFIRMED }),
    Booking.aggregate([{ $match: { status: STATUS.CONFIRMED } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  res.json({ bookings, confirmed, revenue: revenueAgg[0]?.total || 0 });
}));

// Doctor verification
router.get('/doctors/pending', asyncHandler(async (_req, res) =>
  res.json(await User.find({ doctorStatus: 'pending' }).select('+regNo name email regNo'))));

router.post('/doctors/:id/verify', asyncHandler(async (req, res) => {
  const { approve } = z.object({ approve: z.boolean() }).parse(req.body);
  const u = await User.findByIdAndUpdate(req.params.id, { doctorStatus: approve ? 'verified' : 'rejected' }, { new: true });
  res.json({ id: u._id, doctorStatus: u.doctorStatus });
}));

export default router;
