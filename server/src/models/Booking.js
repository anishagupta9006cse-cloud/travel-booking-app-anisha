import mongoose from 'mongoose';
import { STATUS, canTransition } from '../utils/bookingState.js';

const bookingSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  travelers: { type: Number, required: true, min: 1, max: 10 },
  startDate: { type: Date, required: true },
  coach: String, // coach / seat area (emergency matching ke liye)
  amount: { type: Number, required: true },
  status: { type: String, enum: Object.values(STATUS), default: STATUS.DRAFT },
  history: [{ status: String, at: { type: Date, default: Date.now }, note: String }], // audit log
}, { timestamps: true });

bookingSchema.pre('validate', function (next) {
  if (!this.code) this.code = 'TB' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1e3);
  if (this.isNew) this.history.push({ status: this.status, note: 'created' });
  next();
});

// Saari state changes yahin se hongi
bookingSchema.methods.moveTo = async function (next, note = '') {
  if (!canTransition(this.status, next)) {
    const err = new Error(`Invalid booking transition ${this.status} -> ${next}`);
    err.status = 409;
    throw err;
  }
  this.status = next;
  this.history.push({ status: next, note });
  return this.save();
};

export default mongoose.model('Booking', bookingSchema);
