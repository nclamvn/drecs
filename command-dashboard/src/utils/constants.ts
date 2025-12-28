// ═══════════════════════════════════════════════════════════════
//                    DRECS - Constants
// ═══════════════════════════════════════════════════════════════

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Map defaults (Thừa Thiên Huế, Vietnam)
export const MAP_CENTER: [number, number] = [16.4637, 107.5909];
export const MAP_ZOOM = 12;

// Status labels
export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  ASSIGNED: 'Đã gán',
  IN_PROGRESS: 'Đang cứu',
  RESCUED: 'Đã cứu',
  UNREACHABLE: 'Không liên lạc được',
};

export const TEAM_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng',
  BUSY: 'Đang làm việc',
  OFFLINE: 'Offline',
};

export const DRONE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  IDLE: 'Chờ',
  RETURNING: 'Đang về',
  OFFLINE: 'Offline',
};

// Team type labels
export const TEAM_TYPE_LABELS: Record<string, string> = {
  BOAT: 'Xuồng',
  HELICOPTER: 'Trực thăng',
  FOOT: 'Bộ binh',
  TRUCK: 'Xe cứu hộ',
};

export const TEAM_TYPE_ICONS: Record<string, string> = {
  BOAT: '🚤',
  HELICOPTER: '🚁',
  FOOT: '🚶',
  TRUCK: '🚚',
};

// Urgency labels
export const URGENCY_LABELS: Record<number, string> = {
  1: 'Thấp',
  2: 'Trung bình',
  3: 'Khẩn cấp',
};

export const URGENCY_COLORS: Record<number, string> = {
  1: 'bg-green-500',
  2: 'bg-yellow-500',
  3: 'bg-red-500',
};

// Water level labels
export const WATER_LEVEL_LABELS: Record<string, string> = {
  '<0.5m': 'Dưới 0.5m',
  '0.5-1m': '0.5-1m',
  '1-2m': '1-2m',
  '>2m': 'Trên 2m',
};

// Refresh intervals (ms)
export const REFRESH_INTERVAL = 30000; // 30 seconds
export const SOCKET_RECONNECT_INTERVAL = 5000; // 5 seconds
