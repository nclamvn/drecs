// ═══════════════════════════════════════════════════════════════
//                    DRECS - LoRa Ingestion Routes
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { loraAuth } from '../middlewares/loraAuth.js';
import { calculatePriorityScore, findNearestTeam } from '../services/priority.service.js';
import { emitNewRescuePoint, emitRescuePointUpdated, broadcast } from '../services/realtime.service.js';
import { generateShortId } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface LoraRescueInput {
  lat: number;
  lng: number;
  people: number;
  urgency: 'low' | 'medium' | 'high';
  injured: boolean;
  water_level: number;  // 0-3
  no_food: boolean;
  is_panic: boolean;
  phone: string;        // Masked: "****1234"
  fingerprint: string;  // Hex string
  source_drone: number;
  source_channel: 'lora_fixed' | 'lora_mobile';
}

// ─────────────────────────────────────────────────────────────────
// POST /api/rescues/lora - Receive from LoRa Gateway Bridge
// ─────────────────────────────────────────────────────────────────

router.post('/rescues/lora', loraAuth, async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const loraData: LoraRescueInput = req.body;
    const sourceChannel = (req as any).gatewaySource === 'lora-gateway-fixed'
      ? 'lora_fixed'
      : 'lora_mobile';

    logger.info(`[LoRa] Received rescue from ${sourceChannel}: ${loraData.fingerprint}`);

    // Convert urgency string to number
    const urgencyMap: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3
    };
    const urgency = urgencyMap[loraData.urgency] || 2;

    // Convert water level number to string
    const waterLevelMap: Record<number, string> = {
      0: '<0.5m',
      1: '0.5-1m',
      2: '1-2m',
      3: '>2m'
    };
    const waterLevel = waterLevelMap[loraData.water_level] || '0.5-1m';

    // Check for duplicate by fingerprint
    const existing = await prisma.rescuePoint.findFirst({
      where: { fingerprint: loraData.fingerprint },
      include: { sources: true }
    });

    if (existing) {
      // Log additional source for this rescue
      const existingSource = existing.sources.find(s => s.channel === sourceChannel);

      if (!existingSource) {
        await prisma.rescueSource.create({
          data: {
            rescuePointId: existing.id,
            channel: sourceChannel
          }
        });

        logger.info(`[LoRa] Added source ${sourceChannel} to existing rescue ${existing.id}`);

        // Emit event for additional source
        broadcast('rescue:source_added', {
          rescueId: existing.id,
          channel: sourceChannel,
          sources: [...existing.sources.map(s => s.channel), sourceChannel]
        });
      }

      // Maybe update priority if this report indicates higher urgency
      if (urgency > existing.urgency || loraData.injured !== existing.injured) {
        const updated = await prisma.rescuePoint.update({
          where: { id: existing.id },
          data: {
            urgency: Math.max(existing.urgency, urgency),
            injured: existing.injured || loraData.injured
          }
        });
        emitRescuePointUpdated(updated);
      }

      return res.status(200).json({
        success: true,
        id: existing.id,
        source: sourceChannel,
        is_duplicate: true,
        message: 'Đã có yêu cầu này - ghi nhận nguồn bổ sung'
      });
    }

    // Calculate priority
    const nearest = await findNearestTeam(loraData.lat, loraData.lng);
    const priorityScore = calculatePriorityScore(
      {
        urgency,
        injured: loraData.injured,
        waterLevel,
        foodAvailable: !loraData.no_food,
        people: loraData.people,
        isPanic: loraData.is_panic
      },
      nearest?.distance
    );

    // Create new rescue point
    const rescuePoint = await prisma.rescuePoint.create({
      data: {
        fingerprint: loraData.fingerprint,
        lat: loraData.lat,
        lng: loraData.lng,
        people: loraData.people,
        urgency,
        injured: loraData.injured,
        waterLevel,
        foodAvailable: !loraData.no_food,
        phone: loraData.phone,
        sourceDrone: `D${loraData.source_drone.toString().padStart(2, '0')}`,
        sourceChannel,
        isPanic: loraData.is_panic,
        priorityScore
      }
    });

    // Create initial source record
    await prisma.rescueSource.create({
      data: {
        rescuePointId: rescuePoint.id,
        channel: sourceChannel
      }
    });

    // Create ACK notification
    await prisma.notification.create({
      data: {
        rescuePointId: rescuePoint.id,
        type: 'ACK',
        message: 'Đã nhận yêu cầu cứu hộ qua LoRa.'
      }
    });

    logger.info(`[LoRa] Created rescue point: ${rescuePoint.id} (priority: ${priorityScore})`);

    // Emit realtime event
    emitNewRescuePoint(rescuePoint);

    res.status(201).json({
      success: true,
      id: rescuePoint.id,
      source: sourceChannel,
      is_duplicate: false,
      priority: priorityScore
    });

  } catch (error) {
    logger.error(`[LoRa] Error processing rescue: ${error}`);
    next(error);
  }
});

export { router as loraRouter };
