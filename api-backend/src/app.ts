// ═══════════════════════════════════════════════════════════════
//                    DRECS - Express App Setup
// ═══════════════════════════════════════════════════════════════

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/error-handler.js';
import { requestLogger } from './middlewares/request-logger.js';
import { rateLimiter } from './middlewares/rate-limit.js';

// Routes
import { rescuePointsRouter } from './routes/rescue-points.js';
import { teamsRouter } from './routes/teams.js';
import { missionsRouter } from './routes/missions.js';
import { dronesRouter } from './routes/drones.js';
import { notificationsRouter } from './routes/notifications.js';
import { healthRouter } from './routes/health.js';

const app: Express = express();

// ─────────────────────────────────────────────────────────────────
// MIDDLEWARE - Security
// ─────────────────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: false // Disable for API
}));

// CORS
const corsOrigins = env.CORS_ORIGINS.split(',').map(s => s.trim());
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Drone-Key']
}));

// ─────────────────────────────────────────────────────────────────
// MIDDLEWARE - Parsing
// ─────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────────
// MIDDLEWARE - Logging & Rate Limiting
// ─────────────────────────────────────────────────────────────────

app.use(requestLogger);
app.use(rateLimiter);

// ─────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────

// Health check (no auth)
app.use('/api/health', healthRouter);

// API v1 routes
app.use('/api/v1/rescue-points', rescuePointsRouter);
app.use('/api/v1/teams', teamsRouter);
app.use('/api/v1/missions', missionsRouter);
app.use('/api/v1/drones', dronesRouter);
app.use('/api/v1/notifications', notificationsRouter);

// Legacy routes for M1 compatibility
app.use('/api/rescue-request', rescuePointsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/acknowledge', notificationsRouter);

// ─────────────────────────────────────────────────────────────────
// ROOT & 404
// ─────────────────────────────────────────────────────────────────

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'DRECS API Backend',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health',
    endpoints: {
      rescuePoints: '/api/v1/rescue-points',
      teams: '/api/v1/teams',
      missions: '/api/v1/missions',
      drones: '/api/v1/drones',
      notifications: '/api/v1/notifications'
    }
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// ─────────────────────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────────────────────

app.use(errorHandler);

export { app };
