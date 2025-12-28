// ═══════════════════════════════════════════════════════════════
//                    DRECS - Missions Routes
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import { validateBody } from '../middlewares/validate.js';
import { AppError } from '../middlewares/error-handler.js';
import { emitMissionAssigned, emitMissionCompleted } from '../services/realtime.service.js';
import { calculateDistance, estimateETA } from '../utils/helpers.js';

const router = Router();

// Schemas
const createMissionSchema = z.object({
  rescuePointId: z.string().uuid(),
  teamId: z.string().uuid(),
  notes: z.string().optional()
});

const updateMissionSchema = z.object({
  status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  etaMinutes: z.number().int().min(0).optional()
});

// Helper function
function getDirection(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  const dLat = toLat - fromLat;
  const dLng = toLng - fromLng;
  
  if (Math.abs(dLat) > Math.abs(dLng)) {
    return dLat > 0 ? 'Từ phía Nam' : 'Từ phía Bắc';
  } else {
    return dLng > 0 ? 'Từ phía Tây' : 'Từ phía Đông';
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/missions - Create mission (assign team to rescue point)
// ─────────────────────────────────────────────────────────────────

router.post('/', validateBody(createMissionSchema), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rescuePointId, teamId, notes } = req.body;
    
    const rescuePoint = await prisma.rescuePoint.findUnique({
      where: { id: rescuePointId }
    });
    
    if (!rescuePoint) {
      throw new AppError('Rescue point not found', 404);
    }
    
    if (rescuePoint.status !== 'PENDING') {
      throw new AppError('Rescue point is not pending', 400);
    }
    
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });
    
    if (!team) {
      throw new AppError('Team not found', 404);
    }
    
    if (team.status !== 'AVAILABLE') {
      throw new AppError('Team is not available', 400);
    }
    
    const distance = calculateDistance(rescuePoint.lat, rescuePoint.lng, team.lat, team.lng);
    const etaMinutes = estimateETA(distance, team.type);
    
    const mission = await prisma.mission.create({
      data: {
        rescuePointId,
        teamId,
        etaMinutes,
        notes,
        status: 'ASSIGNED'
      },
      include: {
        rescuePoint: true,
        team: true
      }
    });
    
    await prisma.rescuePoint.update({
      where: { id: rescuePointId },
      data: { status: 'ASSIGNED' }
    });
    
    await prisma.team.update({
      where: { id: teamId },
      data: { status: 'BUSY' }
    });
    
    await prisma.notification.create({
      data: {
        rescuePointId,
        type: 'ETA',
        message: `Đội cứu hộ sẽ đến trong khoảng ${etaMinutes} phút`,
        etaMinutes,
        teamType: team.type,
        direction: getDirection(team.lat, team.lng, rescuePoint.lat, rescuePoint.lng),
        instructions: JSON.stringify([
          'Di chuyển lên vị trí cao nhất có thể',
          'Nếu có áo phao, hãy mặc sẵn',
          'Giữ điện thoại còn pin',
          'Vẫy tay khi thấy đội cứu hộ'
        ])
      }
    });
    
    emitMissionAssigned(mission);
    
    res.status(201).json({
      success: true,
      data: mission
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/missions - List missions
// ─────────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    
    const missions = await prisma.mission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        rescuePoint: true,
        team: true
      }
    });
    
    res.json({
      success: true,
      data: missions
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/missions/active - List active missions
// ─────────────────────────────────────────────────────────────────

router.get('/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const missions = await prisma.mission.findMany({
      where: {
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      orderBy: { createdAt: 'asc' },
      include: {
        rescuePoint: true,
        team: true
      }
    });
    
    res.json({
      success: true,
      data: missions
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/missions/:id - Get single mission
// ─────────────────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        rescuePoint: true,
        team: true
      }
    });
    
    if (!mission) {
      throw new AppError('Mission not found', 404);
    }
    
    res.json({
      success: true,
      data: mission
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/v1/missions/:id - Update mission
// ─────────────────────────────────────────────────────────────────

router.patch('/:id', validateBody(updateMissionSchema), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, notes, etaMinutes } = req.body;
    
    const existing = await prisma.mission.findUnique({
      where: { id },
      include: {
        rescuePoint: true,
        team: true
      }
    });
    
    if (!existing) {
      throw new AppError('Mission not found', 404);
    }
    
    const updateData: any = {};
    if (notes !== undefined) updateData.notes = notes;
    if (etaMinutes !== undefined) updateData.etaMinutes = etaMinutes;
    
    if (status) {
      updateData.status = status;
      
      if (status === 'IN_PROGRESS' && existing.status === 'ASSIGNED') {
        updateData.startedAt = new Date();
        
        await prisma.rescuePoint.update({
          where: { id: existing.rescuePointId },
          data: { status: 'IN_PROGRESS' }
        });
        
        await prisma.notification.create({
          data: {
            rescuePointId: existing.rescuePointId,
            type: 'STATUS',
            message: 'Đội cứu hộ đang trên đường đến'
          }
        });
      }
      
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        
        await prisma.rescuePoint.update({
          where: { id: existing.rescuePointId },
          data: { status: 'RESCUED' }
        });
        
        await prisma.team.update({
          where: { id: existing.teamId },
          data: { status: 'AVAILABLE' }
        });
        
        await prisma.notification.create({
          data: {
            rescuePointId: existing.rescuePointId,
            type: 'COMPLETED',
            message: 'Cứu hộ thành công. Chúc bạn an toàn!'
          }
        });
        
        emitMissionCompleted(existing);
      }
      
      if (status === 'CANCELLED') {
        await prisma.rescuePoint.update({
          where: { id: existing.rescuePointId },
          data: { status: 'PENDING' }
        });
        
        await prisma.team.update({
          where: { id: existing.teamId },
          data: { status: 'AVAILABLE' }
        });
      }
    }
    
    const updated = await prisma.mission.update({
      where: { id },
      data: updateData,
      include: {
        rescuePoint: true,
        team: true
      }
    });
    
    res.json({
      success: true,
      data: updated
    });
    
  } catch (error) {
    next(error);
  }
});

export { router as missionsRouter };
