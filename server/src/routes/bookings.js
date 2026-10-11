import { Router } from 'express';
import { z } from 'zod';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { STATUS } from '../utils/bookingState.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  listingId: z.string(),
  travelers: z.number().int().min(1).max(10),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  coach: z.string().max(20).optional(),
});

router.post('/', asyncHandler(async (req, res) => {
  const d = createSchema.parse(req.body);
  const listing = await Listing.findById(d.listingId);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  const startDate = new Date(d.startDate + 'T00:00:00Z');
  if (startDate < new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) {
    return res.status(400).json({ error: 'Start date cannot be in the past' });
  }
  if (listing.inventory < d.travelers) return res.status(409).json({ error: 'Not enough availability' });

  // PRICE SERVER PAR CALCULATE HOTA HAI, client ka price ignore
  const booking = await Booking.create({
    user: req.user._id, listing: listing._id, travelers: d.travelers,
    startDate, coach: d.coach, amount: listing.price * d.travelers,
  });
  res.status(201).json(booking);
}));

router.get('/mine', asyncHandler(async (req, res) => {
  res.json(await Booking.find({ user: req.user._id }).populate('listing').sort({ createdAt: -1 }));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, user: req.user._id }).populate('listing');
  if (!b) return res.status(404).json({ error: 'Not found' });
  res.json(b);
}));

// Cancel: eligibility check -> state change -> refund initiate
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!b) return res.status(404).json({ error: 'Not found' });
  if (![STATUS.DRAFT, STATUS.PAYMENT_PENDING, STATUS.PAYMENT_FAILED, STATUS.CONFIRMED].includes(b.status)) {
    return res.status(409).json({ error: `Cannot cancel a ${b.status} booking` });
  }
  const wasConfirmed = b.status === STATUS.CONFIRMED;
  if (wasConfirmed && b.startDate <= new Date()) {
    return res.status(409).json({ error: 'Trip already started, cancellation not allowed' });
  }
  await b.moveTo(STATUS.CANCELLED, 'cancelled by user');
  if (wasConfirmed) {
    await Listing.updateOne({ _id: b.listing }, { $inc: { inventory: b.travelers } }); // seats wapas
    await b.moveTo(STATUS.REFUND_PENDING, 'refund initiated');
  }
  res.json(b);
}));

export default router;
