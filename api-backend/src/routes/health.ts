// ═══════════════════════════════════════════════════════════════
//                    DRECS - Health Check Routes
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// GET /api/health - Basic health check
// ─────────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        api: 'up',
        database: 'up',
        websocket: 'up'
      }
    });
    
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database: 'down',
        websocket: 'unknown'
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/health/detailed - Detailed health check
// ─────────────────────────────────────────────────────────────────

router.get('/detailed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    
    // Check database
    let dbStatus = 'down';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
      dbStatus = 'up';
    } catch (e) {
      dbStatus = 'down';
    }
    
    // Get counts
    const [
      rescuePointsCount,
      teamsCount,
      dronesCount,
      activeMissions
    ] = await Promise.all([
      prisma.rescuePoint.count().catch(() => 0),
      prisma.team.count().catch(() => 0),
      prisma.drone.count().catch(() => 0),
      prisma.mission.count({ where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } }).catch(() => 0)
    ]);
    
    const totalLatency = Date.now() - startTime;
    
    res.json({
      success: true,
      status: dbStatus === 'up' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      services: {
        api: {
          status: 'up',
          latency: `${totalLatency}ms`
        },
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`
        }
      },
      counts: {
        rescuePoints: rescuePointsCount,
        teams: teamsCount,
        drones: dronesCount,
        activeMissions: activeMissions
      }
    });
    
  } catch (error) {
    next(error);
  }
});

export { router as healthRouter };
