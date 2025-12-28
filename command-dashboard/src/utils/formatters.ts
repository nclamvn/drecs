// ═══════════════════════════════════════════════════════════════
//                    DRECS - Formatter Utilities
// ═══════════════════════════════════════════════════════════════

import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format relative time (e.g., "5 phút trước")
 */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: vi,
  });
}

/**
 * Format datetime (e.g., "14:30 - 28/12/2025")
 */
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm - dd/MM/yyyy', { locale: vi });
}

/**
 * Format time only (e.g., "14:30")
 */
export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm', { locale: vi });
}

/**
 * Format coordinates (e.g., "16.4637, 107.5909")
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/**
 * Format phone number (hide middle digits)
 */
export function formatPhone(phone: string | null): string {
  if (!phone) return '---';
  if (phone.length >= 10) {
    return phone.slice(0, 4) + '***' + phone.slice(-3);
  }
  return phone;
}

/**
 * Format distance in km
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Format ETA
 */
export function formatETA(minutes: number | null): string {
  if (minutes === null) return '---';
  if (minutes < 60) {
    return `~${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `~${hours}h${mins > 0 ? ` ${mins}p` : ''}`;
}

/**
 * Format battery percentage
 */
export function formatBattery(percent: number | null): string {
  if (percent === null) return '---';
  return `${percent}%`;
}

/**
 * Format priority score
 */
export function formatPriority(score: number): string {
  return score.toString();
}

/**
 * Get priority color class
 */
export function getPriorityColor(score: number): string {
  if (score >= 80) return 'text-red-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-green-600';
}

/**
 * Get status badge class
 */
export function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    PENDING: 'badge-pending',
    ASSIGNED: 'badge-assigned',
    IN_PROGRESS: 'badge-in-progress',
    RESCUED: 'badge-rescued',
    UNREACHABLE: 'badge-unreachable',
    AVAILABLE: 'bg-green-100 text-green-800',
    BUSY: 'bg-yellow-100 text-yellow-800',
    OFFLINE: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    IDLE: 'bg-blue-100 text-blue-800',
    RETURNING: 'bg-yellow-100 text-yellow-800',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}
