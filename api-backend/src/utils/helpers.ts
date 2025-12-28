// ═══════════════════════════════════════════════════════════════
//                    DRECS - Helper Utilities
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a short random ID (4 characters)
 */
export function generateShortId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Generate fingerprint for deduplication
 */
export function generateFingerprint(
  lat: number,
  lng: number,
  phone: string | null,
  people: number
): string {
  const latRound = Math.round(lat * 1000) / 1000;
  const lngRound = Math.round(lng * 1000) / 1000;
  const phoneLast4 = phone ? phone.slice(-4) : '0000';
  
  const str = `${latRound}|${lngRound}|${phoneLast4}|${people}`;
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36).toUpperCase().padStart(8, '0');
}

/**
 * Estimate ETA based on distance and team type
 * @returns ETA in minutes
 */
export function estimateETA(
  distanceKm: number,
  teamType: string
): number {
  // Average speeds in km/h
  const speeds: Record<string, number> = {
    HELICOPTER: 150,
    BOAT: 25,
    TRUCK: 40,
    FOOT: 5
  };
  
  const speed = speeds[teamType] || 20;
  const hours = distanceKm / speed;
  const minutes = Math.ceil(hours * 60);
  
  // Add buffer time
  return minutes + 10;
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string | null): string | null {
  if (!phone) return null;
  
  // Hide middle digits: 0901***234
  if (phone.length >= 10) {
    return phone.slice(0, 4) + '***' + phone.slice(-3);
  }
  
  return phone;
}
