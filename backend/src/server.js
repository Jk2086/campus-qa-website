import { createApp } from './app.js';
import { config } from './config/env.js';
import { initDb, isUsingInMemory } from './config/db.js';
import { logger } from './utils/logger.js';

async function startServer() {
  try {
    logger.info('Initializing CAMPUS-Q&A database...');
    await initDb(true);

    const app = createApp();

    app.listen(config.port, () => {
      logger.info(`====================================================`);
      logger.info(` CAMPUS-Q&A Backend Server Running!`);
      logger.info(` Port:        http://localhost:${config.port}`);
      logger.info(` API Base:    http://localhost:${config.port}/api`);
      logger.info(` Environment: ${config.nodeEnv}`);
      logger.info(` DB Mode:     ${isUsingInMemory() ? 'Embedded In-Memory PostgreSQL (pg-mem)' : 'PostgreSQL Server'}`);
      logger.info(` Institution: ${config.institutionName} (@${config.institutionDomain})`);
      logger.info(`====================================================`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
