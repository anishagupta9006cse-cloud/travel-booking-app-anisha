import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['traveler', 'admin'], default: 'traveler' },
  // Emergency medical assistance
  isDoctor: { type: Boolean, default: false },
  doctorStatus: { type: String, enum: ['none', 'pending', 'verified', 'rejected'], default: 'none' },
  regNo: { type: String, select: false }, // sensitive: default query mein nahi aayega
  emergencyOptIn: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
