import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { initSocket } from './socket.js';
import { errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import emergencyRoutes from './routes/emergency.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 })); // brute-force se bachav

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);
await connectDB();
server.listen(process.env.PORT || 5000, () => console.log('API running on port', process.env.PORT || 5000));
