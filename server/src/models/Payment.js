import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  orderId: { type: String, required: true, unique: true },
  paymentId: String,
  amount: Number,
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  mock: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
