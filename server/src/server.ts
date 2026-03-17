import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { initSocket } from './lib/socket';
import { initPassport } from './lib/passport';

const PORT = env.PORT;

const httpServer = createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

// Initialize Google OAuth (if configured)
initPassport();

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  logger.info(`🔧 Environment: ${env.NODE_ENV}`);
  logger.info(`🔌 Socket.IO ready`);
});
