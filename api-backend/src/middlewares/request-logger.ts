// ═══════════════════════════════════════════════════════════════
//                    DRECS - Request Logger Middleware
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Log request
  logger.debug(`→ ${req.method} ${req.path}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    
    logger[level](`← ${req.method} ${req.path} ${status} ${duration}ms`);
  });
  
  next();
}

export default requestLogger;
