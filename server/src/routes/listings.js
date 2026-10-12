import express from 'express';
import Listing from '../models/Listing.js';

const router = express.Router();

// Helper function (agar asyncHandler missing ho to server crash na ho)
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Helper function regex special characters replace karne ke liye
const escapeRegex = (string) => string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// GET /api/listings

router.get('/', asyncHandler(async (req, res) => {
  console.log("Listing API hit ho gayi!");
  const { origin, destination, type, maxPrice, travelers } = req.query;
  const q = {};

  // Origin filter
  if (origin) {
    q.origin = new RegExp(escapeRegex(String(origin)), 'i');
  }

  // Destination filter
  if (destination) {
    q.destination = new RegExp(escapeRegex(String(destination)), 'i');
  }

  // Type filter
  if (type) {
    q.type = new RegExp(`^${escapeRegex(String(type))}$`, 'i');
  }

  // Max price filter
  if (maxPrice) {
    q.price = { $lte: Number(maxPrice) };
  }

  // Inventory filter
  if (travelers) {
    q.inventory = { $gte: Number(travelers) };
  }

  const results = await Listing.find(q).sort({ price: 1 }).limit(50);
  res.json(results);
}));

// GET /api/listings/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const l = await Listing.findById(req.params.id);
  if (!l) return res.status(404).json({ error: 'Not found' });
  res.json(l);
}));

export default router;