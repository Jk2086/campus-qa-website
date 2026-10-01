import { sendError } from '../utils/response.js';

const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 200; // 200 requests per minute

export function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  const record = requestCounts.get(ip) || { count: 0, resetAt: now + WINDOW_MS };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + WINDOW_MS;
  } else {
    record.count += 1;
  }

  requestCounts.set(ip, record);

  if (record.count > MAX_REQUESTS) {
    return sendError(res, 'Too many requests. Please slow down.', 429);
  }

  next();
}
