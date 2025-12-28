// ═══════════════════════════════════════════════════════════════
//                    DRECS - Rate Limiter Middleware
// ═══════════════════════════════════════════════════════════════

import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // Default: 1 minute
  max: env.RATE_LIMIT_MAX_REQUESTS,   // Default: 100 requests
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health check
  skip: (req) => req.path === '/api/health'
});

// Stricter limiter for sensitive endpoints
export const strictLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
  }
});

export default rateLimiter;
