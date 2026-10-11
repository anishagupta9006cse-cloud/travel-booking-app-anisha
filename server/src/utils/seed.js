import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Listing from '../models/Listing.js';

await mongoose.connect(process.env.MONGO_URI);
await Promise.all([User.deleteMany({}), Listing.deleteMany({})]);

const hash = await bcrypt.hash('password123', 10);
await User.create([
  { name: 'Admin', email: 'admin@demo.com', passwordHash: hash, role: 'admin' },
  { name: 'Riya Traveler', email: 'riya@demo.com', passwordHash: hash },
  { name: 'Dr. Arjun', email: 'doctor@demo.com', passwordHash: hash, isDoctor: true }
]);

await Listing.create([
  // Train Listings
  { type: 'train', title: 'Vande Bharat Express', origin: 'Gaya', destination: 'Patna', price: 650, inventory: 40, description: 'Superfast AC Chair Car with complimentary snacks.' },
  { type: 'train', title: 'Mahabodhi Express', origin: 'Gaya', destination: 'Delhi', price: 1200, inventory: 25, description: 'Direct overnight sleeper and AC train.' },
  
  // Flight Listings
  { type: 'flight', title: 'Delhi to Goa (IndiGo)', origin: 'Delhi', destination: 'Goa', price: 4200, inventory: 15 },
  { type: 'flight', title: 'Gaya to Patna Direct Flight', origin: 'Gaya', destination: 'Patna', price: 2500, inventory: 10 },
  { type: 'flight', title: 'Mumbai to Jaipur (Air India)', origin: 'Mumbai', destination: 'Jaipur', price: 4700, inventory: 18 },

  // Hotel & Package Listings
  { type: 'hotel', title: 'Beachside Resort Goa', destination: 'Goa', price: 3800, inventory: 25, description: 'Sea view, breakfast included.' },
  { type: 'hotel', title: 'Heritage Haveli Jaipur', destination: 'Jaipur', price: 4200, inventory: 18 },
  { type: 'package', title: 'Goa 4N/5D Holiday Package', destination: 'Goa', price: 12000, inventory: 10 },
  { type: 'package', title: 'Manali Adventure 3N/4D', destination: 'Manali', price: 9500, inventory: 12 }
]);

console.log('Seeded. Logins (password: password123): admin@demo.com, riya@demo.com, doctor@demo.com');
await mongoose.disconnect();