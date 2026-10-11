import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL } });
  io.use((socket, next) => {
    try {
      const { id } = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      socket.userId = String(id);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });
  io.on('connection', (socket) => socket.join(`user:${socket.userId}`));
}

export const notifyUser = (userId, event, payload) => io?.to(`user:${userId}`).emit(event, payload);
