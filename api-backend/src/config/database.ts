// ═══════════════════════════════════════════════════════════════
//                    DRECS - Database Config
//        With automatic fallback to mock data
// ═══════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Prevent multiple instances during development hot reload
declare global {
  var prisma: PrismaClient | undefined;
  var dbConnected: boolean;
}

export const prisma = global.prisma || new PrismaClient({
  log: env.NODE_ENV === 'development'
    ? ['warn', 'error']
    : ['error'],
  datasources: {
    db: {
      url: env.DATABASE_URL
    }
  }
});

if (env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Track database connection status
let isDbConnected = false;

/**
 * Check if database is available (silent check)
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    if (!isDbConnected) {
      isDbConnected = true;
      global.dbConnected = true;
      logger.info('✅ Database reconnected');
    }
    return true;
  } catch {
    // Silently switch to mock mode
    isDbConnected = false;
    global.dbConnected = false;
    return false;
  }
}

/**
 * Get database connection status
 */
export function isDbAvailable(): boolean {
  return isDbConnected;
}

// Test connection on startup (don't exit on failure)
(async () => {
  try {
    await prisma.$connect();
    isDbConnected = true;
    global.dbConnected = true;
    logger.info('✅ Database connected successfully');
  } catch {
    isDbConnected = false;
    global.dbConnected = false;
    logger.warn('⚠️ Database unavailable - running in MOCK MODE');
    logger.warn('   Start PostgreSQL: docker-compose up -d');
  }
})();

// Re-check connection every 30 seconds
setInterval(() => {
  checkDbConnection();
}, 30000);

export default prisma;
