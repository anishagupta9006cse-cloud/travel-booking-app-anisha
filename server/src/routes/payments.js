import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { z } from 'zod';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import Payment from '../models/Payment.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { STATUS } from '../utils/bookingState.js';

const router = Router();
router.use(requireAuth);

const MOCK = !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;
const razorpay = MOCK ? null : new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

// Step 1: order banao
router.post('/create-order', asyncHandler(async (req, res) => {
  const { bookingId } = z.object({ bookingId: z.string() }).parse(req.body);
  const b = await Booking.findOne({ _id: bookingId, user: req.user._id });
  if (!b) return res.status(404).json({ error: 'Booking not found' });
  if (![STATUS.DRAFT, STATUS.PAYMENT_FAILED].includes(b.status)) {
    return res.status(409).json({ error: `Booking is ${b.status}` });
  }
  await b.moveTo(STATUS.PAYMENT_PENDING, 'payment started');

  let orderId;
  if (MOCK) {
    orderId = 'mock_order_' + crypto.randomBytes(6).toString('hex');
  } else {
    const order = await razorpay.orders.create({ amount: b.amount * 100, currency: 'INR', receipt: b.code });
    orderId = order.id;
  }
  await Payment.create({ booking: b._id, orderId, amount: b.amount, mock: MOCK });
  res.json({ orderId, amount: b.amount, currency: 'INR', mock: MOCK, keyId: process.env.RAZORPAY_KEY_ID || null });
}));

// Step 2: SERVER par signature verify (idempotent: dobara call karne par double-confirm nahi hoga)
router.post('/verify', asyncHandler(async (req, res) => {
  const d = z.object({
    bookingId: z.string(), orderId: z.string(),
    paymentId: z.string().optional(), signature: z.string().optional(),
  }).parse(req.body);

  const b = await Booking.findOne({ _id: d.bookingId, user: req.user._id });
  const pay = await Payment.findOne({ booking: d.bookingId, orderId: d.orderId });
  if (!b || !pay) return res.status(404).json({ error: 'Not found' });
  if (b.status === STATUS.CONFIRMED) return res.json({ booking: b, alreadyConfirmed: true });

  let valid = false;
  if (pay.mock) {
    valid = d.signature === 'mock';
  } else {
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${d.orderId}|${d.paymentId}`).digest('hex');
    valid = expected === d.signature;
  }

  if (!valid) {
    pay.status = 'failed'; await pay.save();
    await b.moveTo(STATUS.PAYMENT_FAILED, 'signature verification failed');
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  // Inventory atomically reduce (double booking se bachne ke liye)
  const updated = await Listing.findOneAndUpdate(
    { _id: b.listing, inventory: { $gte: b.travelers } },
    { $inc: { inventory: -b.travelers } },
  );
  if (!updated) {
    await b.moveTo(STATUS.PAYMENT_FAILED, 'sold out at confirmation');
    return res.status(409).json({ error: 'Sold out before confirmation' });
  }

  pay.status = 'paid'; pay.paymentId = d.paymentId || 'mock_pay'; await pay.save();
  await b.moveTo(STATUS.CONFIRMED, 'payment verified');
  res.json({ booking: b });
}));

export default router;
