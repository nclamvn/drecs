// ═══════════════════════════════════════════════════════════════
//                    DRECS - Realtime Service
// ═══════════════════════════════════════════════════════════════

import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger.js';

let io: SocketIOServer | null = null;

/**
 * Set Socket.IO instance
 */
export function setSocketIO(socketIO: SocketIOServer) {
  io = socketIO;
}

/**
 * Get Socket.IO instance
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit event to all connected clients
 */
export function broadcast(event: string, data: any) {
  if (io) {
    io.emit(event, data);
    logger.debug(`[WS] Broadcast: ${event}`);
  }
}

/**
 * Emit event to specific room
 */
export function emitToRoom(room: string, event: string, data: any) {
  if (io) {
    io.to(room).emit(event, data);
    logger.debug(`[WS] Emit to room ${room}: ${event}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// SPECIFIC EVENTS
// ─────────────────────────────────────────────────────────────────

export function emitNewRescuePoint(point: any) {
  broadcast('rescue:new', point);
}

export function emitRescuePointUpdated(point: any) {
  broadcast('rescue:updated', point);
}

export function emitTeamMoved(team: any) {
  broadcast('team:moved', team);
}

export function emitDroneStatus(drone: any) {
  broadcast('drone:status', drone);
}

export function emitMissionAssigned(mission: any) {
  broadcast('mission:assigned', mission);
}

export function emitMissionCompleted(mission: any) {
  broadcast('mission:completed', mission);
}

export function emitStats(stats: any) {
  broadcast('stats:updated', stats);
}

export default {
  setSocketIO,
  getIO,
  broadcast,
  emitToRoom,
  emitNewRescuePoint,
  emitRescuePointUpdated,
  emitTeamMoved,
  emitDroneStatus,
  emitMissionAssigned,
  emitMissionCompleted,
  emitStats
};
