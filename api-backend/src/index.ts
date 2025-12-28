// ═══════════════════════════════════════════════════════════════
//                    DRECS - API Backend
//                      Entry Point
// ═══════════════════════════════════════════════════════════════

import { createServer } from 'http';
import { app } from './app.js';
import { initWebSocket } from './websocket/index.js';
import { logger } from './utils/logger.js';
import { env } from './config/env.js';

const PORT = env.PORT;
const HOST = env.HOST;

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket
initWebSocket(server);

// Start server
server.listen(PORT, HOST, () => {
  logger.info('═══════════════════════════════════════════════════════════════');
  logger.info('                    DRECS API Backend                           ');
  logger.info('═══════════════════════════════════════════════════════════════');
  logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
  logger.info(`📊 Environment: ${env.NODE_ENV}`);
  logger.info(`🔌 WebSocket enabled at ws://${HOST}:${PORT}${env.WS_PATH}`);
  logger.info('═══════════════════════════════════════════════════════════════');
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export { server };
