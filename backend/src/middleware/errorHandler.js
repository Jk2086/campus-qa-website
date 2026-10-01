import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.url} - Error: ${err.message}`);
  if (err.stack) {
    logger.debug(err.stack);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : undefined);
}
