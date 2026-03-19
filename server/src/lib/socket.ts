import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // JWT auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
      (socket as any).userId = payload.userId;
      (socket as any).role = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const role = (socket as any).role;

    console.log(`[Socket] User ${userId} (${role}) connected, socket id: ${socket.id}`);
    // Join personal room
    socket.join(`user:${userId}`);
    console.log(`[Socket] User ${userId} joined room 'user:${userId}'`);

    // Staff room for ADMIN/AGENT
    if (role === 'ADMIN' || role === 'AGENT') {
      socket.join('staff');
      console.log(`[Socket] User ${userId} joined room 'staff'`);
    }

    // Ticket detail rooms
    socket.on('join-ticket', (ticketId: number) => {
      socket.join(`ticket:${ticketId}`);
    });

    socket.on('leave-ticket', (ticketId: number) => {
      socket.leave(`ticket:${ticketId}`);
    });

    socket.on('disconnect', () => {
      // cleanup
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function emitToStaff(event: string, data: any) {
  const room = getIO().to('staff');
  console.log(`[Socket] emitToStaff event='${event}'`, JSON.stringify(data));
  room.emit(event, data);
}

export function emitToUser(userId: number, event: string, data: any) {
  console.log(`[Socket] emitToUser userId=${userId} event='${event}'`, JSON.stringify(data));
  getIO().to(`user:${userId}`).emit(event, data);
}

export function emitToTicket(ticketId: number, event: string, data: any) {
  getIO().to(`ticket:${ticketId}`).emit(event, data);
}

export function emitAll(event: string, data?: any) {
  console.log(`[Socket] Broadcasting: ${event}`);
  getIO().emit(event, data);
}
