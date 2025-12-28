// ═══════════════════════════════════════════════════════════════
//                    DRECS - WebSocket Server
// ═══════════════════════════════════════════════════════════════

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { setSocketIO } from '../services/realtime.service.js';

let io: SocketIOServer;

export function initWebSocket(server: HTTPServer) {
  const corsOrigins = env.CORS_ORIGINS.split(',').map(s => s.trim());
  
  io = new SocketIOServer(server, {
    path: env.WS_PATH,
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });
  
  // Set IO instance for realtime service
  setSocketIO(io);
  
  // Connection handler
  io.on('connection', (socket: Socket) => {
    logger.info(`[WS] Client connected: ${socket.id}`);
    
    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to DRECS realtime server',
      socketId: socket.id
    });
    
    // ─────────────────────────────────────────────────────────────────
    // EVENT HANDLERS
    // ─────────────────────────────────────────────────────────────────
    
    // Subscribe to area updates
    socket.on('subscribe:area', (data: { lat: number; lng: number; radius: number }) => {
      const room = `area:${Math.round(data.lat)}:${Math.round(data.lng)}`;
      socket.join(room);
      logger.debug(`[WS] ${socket.id} subscribed to ${room}`);
    });
    
    // Unsubscribe from area
    socket.on('unsubscribe:area', (data: { lat: number; lng: number }) => {
      const room = `area:${Math.round(data.lat)}:${Math.round(data.lng)}`;
      socket.leave(room);
      logger.debug(`[WS] ${socket.id} unsubscribed from ${room}`);
    });
    
    // Subscribe to specific rescue point
    socket.on('subscribe:rescue', (rescueId: string) => {
      socket.join(`rescue:${rescueId}`);
      logger.debug(`[WS] ${socket.id} subscribed to rescue:${rescueId}`);
    });
    
    // Subscribe to drone updates
    socket.on('subscribe:drone', (droneId: string) => {
      socket.join(`drone:${droneId}`);
      logger.debug(`[WS] ${socket.id} subscribed to drone:${droneId}`);
    });
    
    // Ping/Pong for keep-alive
    socket.on('ping', () => {
      socket.emit('pong', { time: Date.now() });
    });
    
    // ─────────────────────────────────────────────────────────────────
    // DISCONNECT
    // ─────────────────────────────────────────────────────────────────
    
    socket.on('disconnect', (reason) => {
      logger.info(`[WS] Client disconnected: ${socket.id} (${reason})`);
    });
    
    socket.on('error', (error) => {
      logger.error(`[WS] Socket error: ${socket.id}`, error);
    });
  });
  
  logger.info(`[WS] WebSocket server initialized at path: ${env.WS_PATH}`);
  
  return io;
}

export function getIO(): SocketIOServer {
  return io;
}

export default { initWebSocket, getIO };
