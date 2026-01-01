// ═══════════════════════════════════════════════════════════════
//                    DRECS - Gateway Service
// ═══════════════════════════════════════════════════════════════

import { PrismaClient, GatewayType } from '@prisma/client';
import { broadcast } from './realtime.service.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface GatewayStatusInput {
  gateway_id: string;
  type: 'fixed' | 'mobile';
  name?: string;
  position?: {
    lat: number;
    lng: number;
  };
  battery?: number;
  signal_4g?: number;
  packets_today?: number;
  devices_seen?: number;
}

// ─────────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Update gateway status (upsert)
 */
export async function updateStatus(status: GatewayStatusInput) {
  const gatewayType = status.type === 'fixed' ? GatewayType.FIXED : GatewayType.MOBILE;

  const gateway = await prisma.gateway.upsert({
    where: { gatewayId: status.gateway_id },
    update: {
      type: gatewayType,
      name: status.name,
      lat: status.position?.lat,
      lng: status.position?.lng,
      battery: status.battery,
      signal4g: status.signal_4g,
      packetsToday: status.packets_today ?? 0,
      devicesSeen: status.devices_seen ?? 0,
      lastSeen: new Date()
    },
    create: {
      gatewayId: status.gateway_id,
      type: gatewayType,
      name: status.name,
      lat: status.position?.lat,
      lng: status.position?.lng,
      battery: status.battery,
      signal4g: status.signal_4g,
      packetsToday: status.packets_today ?? 0,
      devicesSeen: status.devices_seen ?? 0
    }
  });

  // Broadcast to dashboard
  broadcast('gateway:update', {
    ...gateway,
    status: 'online'
  });

  logger.info(`[Gateway] Status updated: ${status.gateway_id}`);

  return gateway;
}

/**
 * Get all active gateways (seen in last 5 minutes)
 */
export async function getActiveGateways() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const gateways = await prisma.gateway.findMany({
    where: {
      lastSeen: { gte: fiveMinutesAgo }
    },
    orderBy: { lastSeen: 'desc' }
  });

  return gateways.map(gw => ({
    ...gw,
    status: 'online'
  }));
}

/**
 * Get all gateways with status
 */
export async function getAllGateways() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const gateways = await prisma.gateway.findMany({
    orderBy: { lastSeen: 'desc' }
  });

  return gateways.map(gw => ({
    ...gw,
    status: gw.lastSeen >= fiveMinutesAgo ? 'online' : 'offline'
  }));
}

/**
 * Get gateway by ID
 */
export async function getGatewayById(gatewayId: string) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const gateway = await prisma.gateway.findUnique({
    where: { gatewayId }
  });

  if (!gateway) return null;

  return {
    ...gateway,
    status: gateway.lastSeen >= fiveMinutesAgo ? 'online' : 'offline'
  };
}

/**
 * Get gateway statistics
 */
export async function getGatewayStats() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [total, online, fixed, mobile] = await Promise.all([
    prisma.gateway.count(),
    prisma.gateway.count({
      where: { lastSeen: { gte: fiveMinutesAgo } }
    }),
    prisma.gateway.count({
      where: { type: GatewayType.FIXED }
    }),
    prisma.gateway.count({
      where: { type: GatewayType.MOBILE }
    })
  ]);

  // Total packets today
  const packetsResult = await prisma.gateway.aggregate({
    _sum: { packetsToday: true }
  });

  return {
    total,
    online,
    offline: total - online,
    fixed,
    mobile,
    packetsToday: packetsResult._sum.packetsToday ?? 0
  };
}

export default {
  updateStatus,
  getActiveGateways,
  getAllGateways,
  getGatewayById,
  getGatewayStats
};
