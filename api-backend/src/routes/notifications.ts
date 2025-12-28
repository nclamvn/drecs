// ═══════════════════════════════════════════════════════════════
//                    DRECS - Notifications Routes
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import { validateBody } from '../middlewares/validate.js';
import { AppError } from '../middlewares/error-handler.js';

const router = Router();

// Schemas
const createNotificationSchema = z.object({
  rescuePointId: z.string().uuid(),
  type: z.enum(['ACK', 'ETA', 'INSTRUCTION', 'STATUS', 'COMPLETED']),
  message: z.string(),
  etaMinutes: z.number().int().optional(),
  teamType: z.string().optional(),
  direction: z.string().optional(),
  instructions: z.array(z.string()).optional()
});

const acknowledgeSchema = z.object({
  request_id: z.string(),
  acknowledged_at: z.string().datetime().optional()
});

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/notifications - Create notification
// ─────────────────────────────────────────────────────────────────

router.post('/', validateBody(createNotificationSchema), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    
    // Verify rescue point exists
    const rescuePoint = await prisma.rescuePoint.findUnique({
      where: { id: data.rescuePointId }
    });
    
    if (!rescuePoint) {
      throw new AppError('Rescue point not found', 404);
    }
    
    const notification = await prisma.notification.create({
      data: {
        rescuePointId: data.rescuePointId,
        type: data.type,
        message: data.message,
        etaMinutes: data.etaMinutes,
        teamType: data.teamType,
        direction: data.direction,
        instructions: data.instructions ? JSON.stringify(data.instructions) : null
      }
    });
    
    res.status(201).json({
      success: true,
      data: notification
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/notifications/:requestId - Get notifications for rescue point
// Also handles: GET /api/notifications/:requestId (M1 compatibility)
// ─────────────────────────────────────────────────────────────────

router.get('/:requestId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    
    // Try to find by rescue point ID first
    let rescuePoint = await prisma.rescuePoint.findUnique({
      where: { id: requestId }
    });
    
    // If not found by ID, try by fingerprint
    if (!rescuePoint) {
      rescuePoint = await prisma.rescuePoint.findUnique({
        where: { fingerprint: requestId }
      });
    }
    
    if (!rescuePoint) {
      // Return 404 if not found - M1 expects this for polling
      return res.status(404).json({
        success: false,
        error: 'Not found',
        hasNotification: false
      });
    }
    
    // Get latest unread notification
    const notification = await prisma.notification.findFirst({
      where: {
        rescuePointId: rescuePoint.id,
        readAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!notification) {
      return res.json({
        success: true,
        hasNotification: false
      });
    }
    
    // Parse instructions if stored as JSON string
    let instructions = notification.instructions;
    if (typeof instructions === 'string') {
      try {
        instructions = JSON.parse(instructions);
      } catch (e) {
        instructions = [];
      }
    }
    
    // Format response for M1 compatibility
    res.json({
      success: true,
      hasNotification: true,
      notification: {
        request_id: requestId,
        type: notification.type.toLowerCase(),
        message: notification.message,
        eta_minutes: notification.etaMinutes,
        team_type: notification.teamType?.toLowerCase(),
        direction: notification.direction,
        instructions: instructions || []
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/notifications/acknowledge - Mark notification as read
// Also handles: POST /api/acknowledge (M1 compatibility)
// ─────────────────────────────────────────────────────────────────

router.post('/acknowledge', validateBody(acknowledgeSchema), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { request_id, acknowledged_at } = req.body;
    
    // Find rescue point
    let rescuePoint = await prisma.rescuePoint.findUnique({
      where: { id: request_id }
    });
    
    if (!rescuePoint) {
      rescuePoint = await prisma.rescuePoint.findUnique({
        where: { fingerprint: request_id }
      });
    }
    
    if (!rescuePoint) {
      throw new AppError('Rescue point not found', 404);
    }
    
    // Mark all unread notifications as read
    await prisma.notification.updateMany({
      where: {
        rescuePointId: rescuePoint.id,
        readAt: null
      },
      data: {
        readAt: acknowledged_at ? new Date(acknowledged_at) : new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Notifications acknowledged'
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/notifications - List all notifications (admin)
// ─────────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '50', offset = '0' } = req.query;
    
    const notifications = await prisma.notification.findMany({
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { createdAt: 'desc' },
      include: {
        rescuePoint: {
          select: {
            id: true,
            fingerprint: true,
            phone: true,
            status: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: notifications
    });
    
  } catch (error) {
    next(error);
  }
});

export { router as notificationsRouter };
