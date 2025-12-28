// ═══════════════════════════════════════════════════════════════
//                    DRECS - Drones Routes
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import { validateBody } from '../middlewares/validate.js';
import { AppError } from '../middlewares/error-handler.js';
import { emitDroneStatus } from '../services/realtime.service.js';

const router = Router();

// Schemas
const heartbeatSchema = z.object({
  droneId: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  altitude: z.number().int().optional(),
  batteryPercent: z.number().int().min(0).max(100).optional(),
  signalStrength: z.enum(['strong', 'medium', 'weak']).optional(),
  connectedUsers: z.number().int().min(0).optional(),
  queueSize: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'IDLE', 'RETURNING', 'OFFLINE']).optional()
});

const updateDroneSchema = z.object({
  name: z.string().max(100).optional(),
  status: z.enum(['ACTIVE', 'IDLE', 'RETURNING', 'OFFLINE']).optional()
});

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/drones/heartbeat - Receive drone heartbeat
// ─────────────────────────────────────────────────────────────────

router.post('/heartbeat', validateBody(heartbeatSchema), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    const droneId = data.droneId || req.headers['x-drone-id'] as string;
    
    if (!droneId) {
      throw new AppError('Drone ID required', 400);
    }
    
    // Upsert drone record
    const drone = await prisma.drone.upsert({
      where: { id: droneId },
      update: {
        lat: data.lat,
        lng: data.lng,
        altitude: data.altitude,
        batteryPercent: data.batteryPercent,
        signalStrength: data.signalStrength,
        connectedUsers: data.connectedUsers ?? 0,
        queueSize: data.queueSize ?? 0,
        status: data.status || 'ACTIVE',
        lastHeartbeat: new Date()
      },
      create: {
        id: droneId,
        name: `Drone ${droneId}`,
        lat: data.lat,
        lng: data.lng,
        altitude: data.altitude,
        batteryPercent: data.batteryPercent,
        signalStrength: data.signalStrength,
        connectedUsers: data.connectedUsers ?? 0,
        queueSize: data.queueSize ?? 0,
        status: data.status || 'ACTIVE',
        lastHeartbeat: new Date()
      }
    });
    
    // Emit realtime update
    emitDroneStatus(drone);
    
    res.json({
      success: true,
      data: {
        id: drone.id,
        status: drone.status,
        lastHeartbeat: drone.lastHeartbeat
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/drones - List all drones
// ─────────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    
    const drones = await prisma.drone.findMany({
      where,
      orderBy: { id: 'asc' }
    });
    
    // Mark drones as offline if no heartbeat in 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const dronesWithHealth = drones.map(drone => ({
      ...drone,
      isHealthy: drone.lastHeartbeat && drone.lastHeartbeat > fiveMinutesAgo
    }));
    
    res.json({
      success: true,
      data: dronesWithHealth
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/drones/stats - Get drone statistics
// ─────────────────────────────────────────────────────────────────

router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      total,
      active,
      idle,
      returning,
      offline
    ] = await Promise.all([
      prisma.drone.count(),
      prisma.drone.count({ where: { status: 'ACTIVE' } }),
      prisma.drone.count({ where: { status: 'IDLE' } }),
      prisma.drone.count({ where: { status: 'RETURNING' } }),
      prisma.drone.count({ where: { status: 'OFFLINE' } })
    ]);
    
    // Get aggregates
    const aggregates = await prisma.drone.aggregate({
      _avg: {
        batteryPercent: true,
        connectedUsers: true,
        queueSize: true
      },
      _sum: {
        connectedUsers: true,
        queueSize: true
      }
    });
    
    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          active,
          idle,
          returning,
          offline
        },
        aggregates: {
          avgBattery: Math.round(aggregates._avg.batteryPercent || 0),
          totalConnectedUsers: aggregates._sum.connectedUsers || 0,
          totalQueueSize: aggregates._sum.queueSize || 0
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/drones/:id - Get single drone
// ─────────────────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const drone = await prisma.drone.findUnique({
      where: { id }
    });
    
    if (!drone) {
      throw new AppError('Drone not found', 404);
    }
    
    res.json({
      success: true,
      data: drone
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/v1/drones/:id - Update drone
// ─────────────────────────────────────────────────────────────────

router.patch('/:id', validateBody(updateDroneSchema), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const existing = await prisma.drone.findUnique({
      where: { id }
    });
    
    if (!existing) {
      throw new AppError('Drone not found', 404);
    }
    
    const updated = await prisma.drone.update({
      where: { id },
      data
    });
    
    emitDroneStatus(updated);
    
    res.json({
      success: true,
      data: updated
    });
    
  } catch (error) {
    next(error);
  }
});

export { router as dronesRouter };
