import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import answerRoutes from './routes/answerRoutes.js';
import voteRoutes from './routes/voteRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

import { questionController } from './controllers/questionController.js';
import { reportController } from './controllers/reportController.js';
import { authenticateOptional } from './middleware/auth.js';

export function createApp() {
  const app = express();

  // Basic Middlewares
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }
  app.use(rateLimiter);

  // Health check
  const healthHandler = (req, res) => {
    res.json({
      status: 'healthy',
      app: 'CAMPUS-Q&A Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  };
  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // Helper to mount routers under a given prefix
  const mountRoutes = (prefix = '') => {
    const r = (path) => (prefix ? `${prefix}${path}` : path);

    app.use(r('/auth'), authRoutes);
    app.use(r('/users'), userRoutes);
    app.use(r('/questions'), questionRoutes);
    app.use(r('/answers'), answerRoutes);
    app.use(r('/votes'), voteRoutes);
    app.use(r('/mentors'), mentorRoutes);
    app.use(r('/ai'), aiRoutes);
    app.use(r('/notifications'), notificationRoutes);
    app.use(r('/reports'), reportRoutes);
    app.use(r('/resources'), resourceRoutes);
    app.use(r('/tasks'), taskRoutes);
    app.use(r('/knowledge'), knowledgeRoutes);
    app.use(r('/search'), searchRoutes);

    // Direct frontend mock-compat endpoints
    app.get(r('/topics/popular'), questionController.getPopularTopics);
    app.get(r('/me/saved'), authenticateOptional, questionController.getSaved);
    app.get(r('/admin/reports'), authenticateOptional, reportController.getReports);
    app.put(r('/admin/reports/:id'), authenticateOptional, reportController.updateReport);
    app.get(r('/moderation/reports'), authenticateOptional, reportController.getReports);
    app.put(r('/moderation/reports/:id'), authenticateOptional, reportController.updateReport);
    app.get(r('/moderation/logs'), authenticateOptional, reportController.getLogs);
  };

  // Mount at both /api and root / for zero-friction Lovable integration
  mountRoutes('/api');
  mountRoutes('');

  // 404 handler for unknown routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.url}`,
    });
  });

  // Central error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
