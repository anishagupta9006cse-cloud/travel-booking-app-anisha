import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['flight', 'train', 'hotel', 'package'], // 'train' added here
    required: true 
  },
  title: { type: String, required: true },
  destination: { type: String, required: true, index: true },
  origin: String,
  price: { type: Number, required: true, min: 0 },
  inventory: { type: Number, required: true, min: 0 },
  description: String,
  lat: Number,
  lng: Number,
}, { timestamps: true });

export default mongoose.model('Listing', listingSchema);