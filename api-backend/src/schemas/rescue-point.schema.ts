// ═══════════════════════════════════════════════════════════════
//                    DRECS - Rescue Point Schemas
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

/**
 * Schema for creating a new rescue point (from drone/M1)
 */
export const createRescuePointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  people: z.number().int().min(1).max(100).default(1),
  urgency: z.number().int().min(1).max(3).default(3),
  injured: z.boolean().default(false),
  water_level: z.string().optional().nullable(),
  food_available: z.boolean().default(true),
  phone: z.string().max(15).optional().nullable(),
  timestamp: z.string().datetime().optional(),
  fingerprint: z.string().optional(),
  is_panic: z.boolean().default(false),
  source_drone: z.string().optional()
});

export type CreateRescuePointInput = z.infer<typeof createRescuePointSchema>;

/**
 * Schema for updating rescue point status
 */
export const updateRescuePointSchema = z.object({
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESCUED', 'UNREACHABLE']).optional(),
  people: z.number().int().min(1).max(100).optional(),
  urgency: z.number().int().min(1).max(3).optional(),
  injured: z.boolean().optional(),
  notes: z.string().optional()
});

export type UpdateRescuePointInput = z.infer<typeof updateRescuePointSchema>;

/**
 * Schema for query parameters
 */
export const rescuePointQuerySchema = z.object({
  status: z.string().optional(),
  urgency: z.string().optional(),
  limit: z.string().transform(Number).default('50'),
  offset: z.string().transform(Number).default('0'),
  sortBy: z.enum(['priorityScore', 'createdAt', 'urgency']).default('priorityScore'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type RescuePointQuery = z.infer<typeof rescuePointQuerySchema>;
