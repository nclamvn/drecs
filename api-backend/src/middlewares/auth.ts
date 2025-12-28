// ═══════════════════════════════════════════════════════════════
//                    DRECS - Authentication Middleware
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './error-handler.js';

// Extend Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
      droneId?: string;
    }
  }
}

/**
 * Verify JWT token for dashboard/admin access
 */
export function authRequired(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      role: string;
    };
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
}

/**
 * Verify drone API key
 */
export function droneAuthRequired(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-drone-key'] as string;
  
  if (!apiKey) {
    return next(new AppError('No API key provided', 401));
  }
  
  if (apiKey !== env.DRONE_API_KEY) {
    return next(new AppError('Invalid API key', 401));
  }
  
  // Extract drone ID from header if provided
  req.droneId = req.headers['x-drone-id'] as string;
  
  next();
}

/**
 * Optional auth - doesn't fail if no token
 */
export function authOptional(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        role: string;
      };
      req.user = decoded;
    }
    
    next();
  } catch {
    // Ignore errors, just continue without auth
    next();
  }
}

/**
 * Generate JWT token
 */
export function generateToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

export default { authRequired, droneAuthRequired, authOptional, generateToken };
