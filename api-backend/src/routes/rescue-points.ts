// ═══════════════════════════════════════════════════════════════
//                    DRECS - Rescue Points Routes
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import prisma, { isDbAvailable } from '../config/database.js';
import { validateBody, validateQuery } from '../middlewares/validate.js';
import {
  createRescuePointSchema,
  updateRescuePointSchema,
  rescuePointQuerySchema,
  CreateRescuePointInput
} from '../schemas/rescue-point.schema.js';
import { calculatePriorityScore, findNearestTeam } from '../services/priority.service.js';
import { generateFingerprint, generateShortId } from '../utils/helpers.js';
import { emitNewRescuePoint, emitRescuePointUpdated } from '../services/realtime.service.js';
import { AppError } from '../middlewares/error-handler.js';
import { logger } from '../utils/logger.js';
import { mockRescuePoints, addMockRescuePoint, updateMockRescuePoint, mockStats } from '../services/mock.service.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/rescue-points - Create new rescue point
// Also handles: POST /api/rescue-request (M1 compatibility)
// ─────────────────────────────────────────────────────────────────

router.post('/', validateBody(createRescuePointSchema), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: CreateRescuePointInput = req.body;

    // Generate fingerprint if not provided
    const fingerprint = data.fingerprint || generateFingerprint(
      data.lat,
      data.lng,
      data.phone || null,
      data.people
    );

    // MOCK MODE: Use mock data when DB unavailable
    if (!isDbAvailable()) {
      const priorityScore = calculatePriorityScore(
        {
          urgency: data.urgency,
          injured: data.injured,
          waterLevel: data.water_level,
          foodAvailable: data.food_available,
          people: data.people,
          isPanic: data.is_panic
        },
        null
      );

      const mockPoint = addMockRescuePoint({
        ...data,
        fingerprint,
        priorityScore
      });

      logger.info(`[MOCK] Created rescue point: ${mockPoint.id}`);
      emitNewRescuePoint(mockPoint);

      return res.status(201).json({
        success: true,
        request_id: generateShortId(),
        message: 'Đã nhận yêu cầu cứu hộ (Mock Mode)',
        data: {
          id: mockPoint.id,
          fingerprint: mockPoint.fingerprint,
          priorityScore: mockPoint.priorityScore
        }
      });
    }

    // DB MODE: Normal database operation
    // Check for duplicate
    const existing = await prisma.rescuePoint.findUnique({
      where: { fingerprint }
    });

    if (existing) {
      // Update existing instead of creating duplicate
      const updated = await prisma.rescuePoint.update({
        where: { fingerprint },
        data: {
          urgency: Math.max(existing.urgency, data.urgency),
          injured: existing.injured || data.injured,
          waterLevel: data.water_level || existing.waterLevel,
          foodAvailable: data.food_available ?? existing.foodAvailable,
          people: Math.max(existing.people, data.people),
          updatedAt: new Date()
        }
      });

      logger.info(`Updated existing rescue point: ${fingerprint}`);

      emitRescuePointUpdated(updated);

      return res.json({
        success: true,
        request_id: generateShortId(),
        message: 'Đã cập nhật yêu cầu',
        data: updated
      });
    }

    // Calculate priority
    const nearest = await findNearestTeam(data.lat, data.lng);
    const priorityScore = calculatePriorityScore(
      {
        urgency: data.urgency,
        injured: data.injured,
        waterLevel: data.water_level,
        foodAvailable: data.food_available,
        people: data.people,
        isPanic: data.is_panic
      },
      nearest?.distance
    );

    // Create new rescue point
    const rescuePoint = await prisma.rescuePoint.create({
      data: {
        fingerprint,
        lat: data.lat,
        lng: data.lng,
        people: data.people,
        urgency: data.urgency,
        injured: data.injured,
        waterLevel: data.water_level,
        foodAvailable: data.food_available,
        phone: data.phone,
        sourceDrone: data.source_drone || req.headers['x-drone-id'] as string,
        isPanic: data.is_panic,
        priorityScore
      }
    });

    logger.info(`Created new rescue point: ${rescuePoint.id} (priority: ${priorityScore})`);

    // Emit realtime event
    emitNewRescuePoint(rescuePoint);

    // Create ACK notification
    await prisma.notification.create({
      data: {
        rescuePointId: rescuePoint.id,
        type: 'ACK',
        message: 'Đã nhận yêu cầu cứu hộ. Vui lòng chờ phản hồi.'
      }
    });

    res.status(201).json({
      success: true,
      request_id: generateShortId(),
      message: 'Đã nhận yêu cầu cứu hộ',
      data: {
        id: rescuePoint.id,
        fingerprint: rescuePoint.fingerprint,
        priorityScore: rescuePoint.priorityScore
      }
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/rescue-points - List all rescue points
// ─────────────────────────────────────────────────────────────────

router.get('/', validateQuery(rescuePointQuerySchema), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, urgency, limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as any;

    // MOCK MODE
    if (!isDbAvailable()) {
      let filtered = [...mockRescuePoints];

      if (status) {
        filtered = filtered.filter(r => r.status === status);
      }
      if (urgency) {
        filtered = filtered.filter(r => r.urgency === parseInt(urgency));
      }

      // Sort
      filtered.sort((a: any, b: any) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (sortOrder === 'desc') return bVal > aVal ? 1 : -1;
        return aVal > bVal ? 1 : -1;
      });

      const total = filtered.length;
      const data = filtered.slice(offset, offset + limit);

      return res.json({
        success: true,
        data,
        meta: { total, limit, offset, hasMore: offset + data.length < total },
        mode: 'mock'
      });
    }

    // DB MODE
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (urgency) {
      where.urgency = parseInt(urgency);
    }

    const [rescuePoints, total] = await Promise.all([
      prisma.rescuePoint.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          missions: {
            include: {
              team: true
            }
          }
        }
      }),
      prisma.rescuePoint.count({ where })
    ]);

    res.json({
      success: true,
      data: rescuePoints,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + rescuePoints.length < total
      }
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/rescue-points/stats - Get statistics
// ─────────────────────────────────────────────────────────────────

router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // MOCK MODE
    if (!isDbAvailable()) {
      return res.json({
        success: true,
        data: mockStats.rescuePoints,
        mode: 'mock'
      });
    }

    // DB MODE
    const [
      total,
      pending,
      assigned,
      inProgress,
      rescued,
      unreachable,
      critical,
      withInjured
    ] = await Promise.all([
      prisma.rescuePoint.count(),
      prisma.rescuePoint.count({ where: { status: 'PENDING' } }),
      prisma.rescuePoint.count({ where: { status: 'ASSIGNED' } }),
      prisma.rescuePoint.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.rescuePoint.count({ where: { status: 'RESCUED' } }),
      prisma.rescuePoint.count({ where: { status: 'UNREACHABLE' } }),
      prisma.rescuePoint.count({ where: { urgency: 3, status: 'PENDING' } }),
      prisma.rescuePoint.count({ where: { injured: true, status: { in: ['PENDING', 'ASSIGNED'] } } })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          pending,
          assigned,
          inProgress,
          rescued,
          unreachable
        },
        alerts: {
          critical,
          withInjured
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/rescue-points/:id - Get single rescue point
// ─────────────────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // MOCK MODE
    if (!isDbAvailable()) {
      const point = mockRescuePoints.find(r => r.id === id);
      if (!point) {
        throw new AppError('Rescue point not found', 404);
      }
      return res.json({ success: true, data: point, mode: 'mock' });
    }

    // DB MODE
    const rescuePoint = await prisma.rescuePoint.findUnique({
      where: { id },
      include: {
        missions: {
          include: {
            team: true
          }
        },
        notifications: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!rescuePoint) {
      throw new AppError('Rescue point not found', 404);
    }

    res.json({
      success: true,
      data: rescuePoint
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/v1/rescue-points/:id - Update rescue point
// ─────────────────────────────────────────────────────────────────

router.patch('/:id', validateBody(updateRescuePointSchema), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const existing = await prisma.rescuePoint.findUnique({
      where: { id }
    });
    
    if (!existing) {
      throw new AppError('Rescue point not found', 404);
    }
    
    const updated = await prisma.rescuePoint.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
    
    emitRescuePointUpdated(updated);
    
    res.json({
      success: true,
      data: updated
    });
    
  } catch (error) {
    next(error);
  }
});

export { router as rescuePointsRouter };
