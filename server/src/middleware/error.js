import { ZodError } from 'zod';

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`) });
  }
  if (err.code === 11000) return res.status(409).json({ error: 'Already exists' });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id' });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error' });
}
