// ═══════════════════════════════════════════════════════════════
//                    DRECS - Teams Routes
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import { validateBody } from '../middlewares/validate.js';
import { AppError } from '../middlewares/error-handler.js';
import { emitTeamMoved } from '../services/realtime.service.js';
import { calculateDistance } from '../utils/helpers.js';

const router = Router();

// Schemas
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['BOAT', 'HELICOPTER', 'FOOT', 'TRUCK']),
  capacity: z.number().int().min(1).max(100).default(5),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  phone: z.string().max(15).optional(),
  leader: z.string().max(100).optional()
});

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']).optional(),
  capacity: z.number().int().min(1).max(100).optional()
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/teams - List all teams
// ─────────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    
    const teams = await prisma.team.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        missions: {
          where: {
            status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
          },
          include: {
            rescuePoint: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: teams
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/teams/available - List available teams
// ─────────────────────────────────────────────────────────────────

router.get('/available', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.query;
    
    const teams = await prisma.team.findMany({
      where: { status: 'AVAILABLE' },
      orderBy: { name: 'asc' }
    });
    
    // If location provided, sort by distance
    if (lat && lng) {
      const targetLat = parseFloat(lat as string);
      const targetLng = parseFloat(lng as string);
      
      const teamsWithDistance = teams.map(team => ({
        ...team,
        distance: calculateDistance(targetLat, targetLng, team.lat, team.lng)
      }));
      
      teamsWithDistance.sort((a, b) => a.distance - b.distance);
      
      return res.json({
        success: true,
        data: teamsWithDistance
      });
    }
    
    res.json({
      success: true,
      data: teams
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/teams - Create new team
// ─────────────────────────────────────────────────────────────────

router.post('/', validateBody(createTeamSchema), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body;
    
    const team = await prisma.team.create({
      data: {
        name: data.name,
        type: data.type,
        capacity: data.capacity,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone,
        leader: data.leader,
        status: 'AVAILABLE'
      }
    });
    
    res.status(201).json({
      success: true,
      data: team
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/teams/:id - Get single team
// ─────────────────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        missions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            rescuePoint: true
          }
        }
      }
    });
    
    if (!team) {
      throw new AppError('Team not found', 404);
    }
    
    res.json({
      success: true,
      data: team
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/v1/teams/:id - Update team
// ─────────────────────────────────────────────────────────────────

router.patch('/:id', validateBody(updateTeamSchema), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const existing = await prisma.team.findUnique({
      where: { id }
    });
    
    if (!existing) {
      throw new AppError('Team not found', 404);
    }
    
    const updated = await prisma.team.update({
      where: { id },
      data
    });
    
    // Emit location update if position changed
    if (data.lat !== undefined || data.lng !== undefined) {
      emitTeamMoved(updated);
    }
    
    res.json({
      success: true,
      data: updated
    });
    
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// DELETE /api/v1/teams/:id - Delete team
// ─────────────────────────────────────────────────────────────────

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    await prisma.team.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Team deleted'
    });
    
  } catch (error) {
    next(error);
  }
});

export { router as teamsRouter };
