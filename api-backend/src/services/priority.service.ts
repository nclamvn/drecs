// ═══════════════════════════════════════════════════════════════
//                    DRECS - Priority Calculation Service
// ═══════════════════════════════════════════════════════════════

import { RescuePoint, Team } from '@prisma/client';
import { calculateDistance } from '../utils/helpers.js';
import prisma from '../config/database.js';

/**
 * Water level scores
 */
const WATER_LEVEL_SCORES: Record<string, number> = {
  '<0.5m': 5,
  '0.5-1m': 10,
  '1-2m': 20,
  '>2m': 30
};

/**
 * Calculate priority score for a rescue point
 * Higher score = higher priority
 */
export function calculatePriorityScore(
  point: {
    urgency: number;
    injured: boolean;
    waterLevel?: string | null;
    foodAvailable: boolean;
    people: number;
    isPanic?: boolean;
  },
  nearestTeamDistance?: number
): number {
  let score = 0;
  
  // Panic button = instant high priority
  if (point.isPanic) {
    score += 50;
  }
  
  // Urgency (1-3) × 30 = max 90
  score += point.urgency * 30;
  
  // Injured: +25
  if (point.injured) {
    score += 25;
  }
  
  // Water level score
  if (point.waterLevel) {
    score += WATER_LEVEL_SCORES[point.waterLevel] || 0;
  }
  
  // No food: +15
  if (!point.foodAvailable) {
    score += 15;
  }
  
  // People count: +2 per person (max 20)
  score += Math.min(point.people * 2, 20);
  
  // Distance penalty: -5 per km (if team info available)
  if (nearestTeamDistance !== undefined) {
    score -= Math.round(nearestTeamDistance * 5);
  }
  
  // Ensure non-negative
  return Math.max(score, 0);
}

/**
 * Find nearest available team to a point
 */
export async function findNearestTeam(
  lat: number,
  lng: number
): Promise<{ team: Team; distance: number } | null> {
  const teams = await prisma.team.findMany({
    where: {
      status: 'AVAILABLE'
    }
  });
  
  if (teams.length === 0) {
    return null;
  }
  
  let nearest: { team: Team; distance: number } | null = null;
  
  for (const team of teams) {
    const distance = calculateDistance(lat, lng, team.lat, team.lng);
    
    if (!nearest || distance < nearest.distance) {
      nearest = { team, distance };
    }
  }
  
  return nearest;
}

/**
 * Recalculate priority for a rescue point and update in DB
 */
export async function updatePriority(pointId: string): Promise<number> {
  const point = await prisma.rescuePoint.findUnique({
    where: { id: pointId }
  });
  
  if (!point) {
    throw new Error('Rescue point not found');
  }
  
  const nearest = await findNearestTeam(point.lat, point.lng);
  
  const score = calculatePriorityScore(
    {
      urgency: point.urgency,
      injured: point.injured,
      waterLevel: point.waterLevel,
      foodAvailable: point.foodAvailable,
      people: point.people,
      isPanic: point.isPanic
    },
    nearest?.distance
  );
  
  await prisma.rescuePoint.update({
    where: { id: pointId },
    data: { priorityScore: score }
  });
  
  return score;
}

/**
 * Bulk recalculate priorities for all pending points
 */
export async function recalculateAllPriorities(): Promise<number> {
  const points = await prisma.rescuePoint.findMany({
    where: {
      status: 'PENDING'
    }
  });
  
  let updated = 0;
  
  for (const point of points) {
    await updatePriority(point.id);
    updated++;
  }
  
  return updated;
}

export default {
  calculatePriorityScore,
  findNearestTeam,
  updatePriority,
  recalculateAllPriorities
};
