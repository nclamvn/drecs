// ═══════════════════════════════════════════════════════════════
//          LoRa Gateway Authentication Middleware
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

const VALID_SOURCES = ['lora-gateway-fixed', 'lora-gateway-mobile'];

/**
 * Middleware to authenticate requests from LoRa Gateways
 * Validates X-Source and X-Gateway-Key headers
 */
export function loraAuth(req: Request, res: Response, next: NextFunction) {
  const sourceHeader = req.headers['x-source'] as string;
  const apiKey = req.headers['x-gateway-key'] as string;

  // Validate source is from known gateway
  if (!sourceHeader || !VALID_SOURCES.includes(sourceHeader)) {
    return res.status(401).json({
      error: 'Invalid source',
      message: 'X-Source header must be one of: ' + VALID_SOURCES.join(', ')
    });
  }

  // Validate API key
  if (apiKey !== env.LORA_GATEWAY_API_KEY) {
    return res.status(401).json({
      error: 'Invalid gateway key',
      message: 'X-Gateway-Key header is invalid'
    });
  }

  // Add source info to request for downstream handlers
  (req as any).gatewaySource = sourceHeader;

  next();
}

/**
 * Simpler auth for gateway status updates (less strict)
 */
export function gatewayAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-gateway-key'] as string;

  if (apiKey !== env.LORA_GATEWAY_API_KEY) {
    return res.status(401).json({
      error: 'Invalid gateway key'
    });
  }

  next();
}
