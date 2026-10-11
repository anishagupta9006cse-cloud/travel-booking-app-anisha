import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  coach: String,
  note: { type: String, maxlength: 300 },
  notified: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['OPEN', 'ACCEPTED', 'RESOLVED'], default: 'OPEN' },
  log: [{ event: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });

export default mongoose.model('Emergency', emergencySchema);
