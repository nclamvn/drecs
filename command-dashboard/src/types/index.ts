// ═══════════════════════════════════════════════════════════════
//                    DRECS - Type Definitions
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
// RESCUE POINT
// ─────────────────────────────────────────────────────────────────

export type RescueStatus = 
  | 'PENDING' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'RESCUED' 
  | 'UNREACHABLE';

export interface RescuePoint {
  id: string;
  fingerprint: string;
  lat: number;
  lng: number;
  people: number;
  urgency: 1 | 2 | 3;
  injured: boolean;
  waterLevel: string | null;
  foodAvailable: boolean;
  phone: string | null;
  status: RescueStatus;
  priorityScore: number;
  sourceDrone: string | null;
  isPanic: boolean;
  createdAt: string;
  updatedAt: string;
  missions?: Mission[];
}

// ─────────────────────────────────────────────────────────────────
// TEAM
// ─────────────────────────────────────────────────────────────────

export type TeamType = 'BOAT' | 'HELICOPTER' | 'FOOT' | 'TRUCK';
export type TeamStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface Team {
  id: string;
  name: string;
  type: TeamType;
  capacity: number;
  lat: number;
  lng: number;
  status: TeamStatus;
  phone: string | null;
  leader: string | null;
  createdAt: string;
  updatedAt: string;
  distance?: number; // Calculated field
  missions?: Mission[];
}

// ─────────────────────────────────────────────────────────────────
// MISSION
// ─────────────────────────────────────────────────────────────────

export type MissionStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Mission {
  id: string;
  rescuePointId: string;
  teamId: string;
  etaMinutes: number | null;
  status: MissionStatus;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  rescuePoint?: RescuePoint;
  team?: Team;
}

// ─────────────────────────────────────────────────────────────────
// DRONE
// ─────────────────────────────────────────────────────────────────

export type DroneStatus = 'ACTIVE' | 'IDLE' | 'RETURNING' | 'OFFLINE';

export interface Drone {
  id: string;
  name: string | null;
  lat: number | null;
  lng: number | null;
  altitude: number | null;
  batteryPercent: number | null;
  signalStrength: 'strong' | 'medium' | 'weak' | null;
  connectedUsers: number;
  queueSize: number;
  status: DroneStatus;
  lastHeartbeat: string | null;
  createdAt: string;
  updatedAt: string;
  isHealthy?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────────────────────────

export type NotificationType = 'ACK' | 'ETA' | 'INSTRUCTION' | 'STATUS' | 'COMPLETED';

export interface Notification {
  id: string;
  rescuePointId: string;
  type: NotificationType;
  message: string;
  etaMinutes: number | null;
  teamType: string | null;
  direction: string | null;
  instructions: string[] | null;
  readAt: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────

export interface RescueStats {
  total: number;
  byStatus: {
    pending: number;
    assigned: number;
    inProgress: number;
    rescued: number;
    unreachable: number;
  };
  alerts: {
    critical: number;
    withInjured: number;
  };
}

export interface DroneStats {
  total: number;
  byStatus: {
    active: number;
    idle: number;
    returning: number;
    offline: number;
  };
  aggregates: {
    avgBattery: number;
    totalConnectedUsers: number;
    totalQueueSize: number;
  };
}

// ─────────────────────────────────────────────────────────────────
// API RESPONSES
// ─────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
}
