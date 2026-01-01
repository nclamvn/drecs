// ═══════════════════════════════════════════════════════════════
//                    DRECS - Gateway Routes
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { gatewayAuth } from '../middlewares/loraAuth.js';
import gatewayService, { GatewayStatusInput } from '../services/gateway.service.js';
import { logger } from '../utils/logger.js';
import { isDbAvailable } from '../config/database.js';
import { mockGateways, mockStats } from '../services/mock.service.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────
// POST /api/gateways/status - Receive gateway status update
// ─────────────────────────────────────────────────────────────────

router.post('/status', gatewayAuth, async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status: GatewayStatusInput = req.body;

    // Validate required fields
    if (!status.gateway_id || !status.type) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['gateway_id', 'type']
      });
    }

    const gateway = await gatewayService.updateStatus(status);

    logger.info(`[Gateway] Status updated: ${status.gateway_id} (${status.type})`);

    res.status(200).json({
      success: true,
      data: gateway
    });

  } catch (error) {
    logger.error(`[Gateway] Error updating status: ${error}`);
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/gateways - List all gateways
// ─────────────────────────────────────────────────────────────────

router.get('/', async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const activeOnly = req.query.active === 'true';

    // MOCK MODE
    if (!isDbAvailable()) {
      let data = [...mockGateways];
      if (activeOnly) {
        data = data.filter(g => g.status === 'online');
      }
      return res.json({
        success: true,
        data,
        meta: { total: data.length, activeOnly },
        mode: 'mock'
      });
    }

    // DB MODE
    const gateways = activeOnly
      ? await gatewayService.getActiveGateways()
      : await gatewayService.getAllGateways();

    res.json({
      success: true,
      data: gateways,
      meta: {
        total: gateways.length,
        activeOnly
      }
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/gateways/stats - Get gateway statistics
// ─────────────────────────────────────────────────────────────────

router.get('/stats', async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // MOCK MODE
    if (!isDbAvailable()) {
      return res.json({
        success: true,
        data: mockStats.gateways,
        mode: 'mock'
      });
    }

    // DB MODE
    const stats = await gatewayService.getGatewayStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/gateways/:gatewayId - Get single gateway
// ─────────────────────────────────────────────────────────────────

router.get('/:gatewayId', async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gatewayId } = req.params;

    const gateway = await gatewayService.getGatewayById(gatewayId);

    if (!gateway) {
      return res.status(404).json({
        error: 'Gateway not found'
      });
    }

    res.json({
      success: true,
      data: gateway
    });

  } catch (error) {
    next(error);
  }
});

export { router as gatewaysRouter };
