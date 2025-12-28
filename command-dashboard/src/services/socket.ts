// ═══════════════════════════════════════════════════════════════
//                    DRECS - WebSocket Service
// ═══════════════════════════════════════════════════════════════

import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, SOCKET_RECONNECT_INTERVAL } from '@/utils/constants';
import type { RescuePoint, Team, Drone, Mission } from '@/types';

// ─────────────────────────────────────────────────────────────────
// SOCKET INSTANCE
// ─────────────────────────────────────────────────────────────────

let socket: Socket | null = null;

// Event callbacks
type EventCallback<T> = (data: T) => void;

const eventCallbacks: {
  'rescue:new': EventCallback<RescuePoint>[];
  'rescue:updated': EventCallback<RescuePoint>[];
  'team:moved': EventCallback<Team>[];
  'drone:status': EventCallback<Drone>[];
  'mission:assigned': EventCallback<Mission>[];
  'mission:completed': EventCallback<Mission>[];
  'stats:updated': EventCallback<any>[];
} = {
  'rescue:new': [],
  'rescue:updated': [],
  'team:moved': [],
  'drone:status': [],
  'mission:assigned': [],
  'mission:completed': [],
  'stats:updated': [],
};

// ─────────────────────────────────────────────────────────────────
// CONNECT
// ─────────────────────────────────────────────────────────────────

export function connect(): Socket {
  if (socket?.connected) {
    return socket;
  }
  
  const url = API_BASE_URL || window.location.origin;
  
  socket = io(url, {
    path: '/socket.io',
    reconnection: true,
    reconnectionDelay: SOCKET_RECONNECT_INTERVAL,
    reconnectionAttempts: 10,
  });
  
  socket.on('connect', () => {
    console.log('[WS] Connected:', socket?.id);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('[WS] Disconnected:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('[WS] Connection error:', error);
  });
  
  // Setup event listeners
  socket.on('rescue:new', (data: RescuePoint) => {
    console.log('[WS] rescue:new', data);
    eventCallbacks['rescue:new'].forEach(cb => cb(data));
  });
  
  socket.on('rescue:updated', (data: RescuePoint) => {
    console.log('[WS] rescue:updated', data);
    eventCallbacks['rescue:updated'].forEach(cb => cb(data));
  });
  
  socket.on('team:moved', (data: Team) => {
    console.log('[WS] team:moved', data);
    eventCallbacks['team:moved'].forEach(cb => cb(data));
  });
  
  socket.on('drone:status', (data: Drone) => {
    console.log('[WS] drone:status', data);
    eventCallbacks['drone:status'].forEach(cb => cb(data));
  });
  
  socket.on('mission:assigned', (data: Mission) => {
    console.log('[WS] mission:assigned', data);
    eventCallbacks['mission:assigned'].forEach(cb => cb(data));
  });
  
  socket.on('mission:completed', (data: Mission) => {
    console.log('[WS] mission:completed', data);
    eventCallbacks['mission:completed'].forEach(cb => cb(data));
  });
  
  socket.on('stats:updated', (data: any) => {
    console.log('[WS] stats:updated', data);
    eventCallbacks['stats:updated'].forEach(cb => cb(data));
  });
  
  return socket;
}

// ─────────────────────────────────────────────────────────────────
// DISCONNECT
// ─────────────────────────────────────────────────────────────────

export function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ─────────────────────────────────────────────────────────────────
// SUBSCRIBE / UNSUBSCRIBE
// ─────────────────────────────────────────────────────────────────

export function subscribeToArea(lat: number, lng: number, radius: number = 50): void {
  socket?.emit('subscribe:area', { lat, lng, radius });
}

export function unsubscribeFromArea(lat: number, lng: number): void {
  socket?.emit('unsubscribe:area', { lat, lng });
}

export function subscribeToRescue(rescueId: string): void {
  socket?.emit('subscribe:rescue', rescueId);
}

export function subscribeToDrone(droneId: string): void {
  socket?.emit('subscribe:drone', droneId);
}

// ─────────────────────────────────────────────────────────────────
// EVENT HANDLERS
// ─────────────────────────────────────────────────────────────────

type EventName = keyof typeof eventCallbacks;

export function on<T>(event: EventName, callback: EventCallback<T>): void {
  (eventCallbacks[event] as EventCallback<T>[]).push(callback);
}

export function off<T>(event: EventName, callback: EventCallback<T>): void {
  const callbacks = eventCallbacks[event] as EventCallback<T>[];
  const index = callbacks.indexOf(callback);
  if (index > -1) {
    callbacks.splice(index, 1);
  }
}

// ─────────────────────────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────────────────────────

export function isConnected(): boolean {
  return socket?.connected ?? false;
}

export function getSocket(): Socket | null {
  return socket;
}

export default {
  connect,
  disconnect,
  subscribeToArea,
  unsubscribeFromArea,
  subscribeToRescue,
  subscribeToDrone,
  on,
  off,
  isConnected,
  getSocket,
};
