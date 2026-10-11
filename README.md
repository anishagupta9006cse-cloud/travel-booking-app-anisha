# Travel Booking Website (Hackathon)

React + Node/Express + MongoDB + Razorpay (sandbox/mock) + Socket.io

## Setup
```bash
# 1) Server
cd server && cp .env.example .env     # JWT_SECRET change karo
npm install
npm run seed                          # demo users + listings
npm run dev                           # http://localhost:5000

# 2) Client (naya terminal)
cd client && cp .env.example .env
npm install
npm run dev                           # http://localhost:5173
```
MongoDB local chalna chahiye (ya MONGO_URI mein Atlas URL daalo).

## Demo logins (password: password123)
- admin@demo.com (admin)
- riya@demo.com (traveler)
- doctor@demo.com (verified doctor, emergency opt-in ON)

## Emergency demo flow
1. Doctor (doctor@demo.com) aur Riya ek hi listing + same date + (best: same coach) par booking confirm karein
2. Doctor ko ek browser mein login rakho, Riya ko dusre browser/incognito mein
3. Riya: My Bookings -> "Emergency Medical Alert"
4. Doctor ko real-time alert dikhega -> Accept
5. Riya ko "doctor accepted" socket event milega

## Payments
RAZORPAY keys khali = MOCK mode (demo safe). Keys daalo = real Razorpay sandbox checkout + HMAC verification.

## Tests
`cd server && npm test`
