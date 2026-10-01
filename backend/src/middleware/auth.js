import { verifyToken } from '../utils/token.js';
import { sendError } from '../utils/response.js';
import { query } from '../config/db.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required. Missing or invalid Authorization header.', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return sendError(res, 'Invalid or expired token.', 401);
  }

  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (!rows.length) {
      return sendError(res, 'User not found.', 401);
    }

    const user = rows[0];
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.student_id,
      role: user.role,
      reputation: user.reputation,
      institution: user.institution,
      subjects: typeof user.subjects === 'string' ? JSON.parse(user.subjects) : user.subjects || [],
      badges: typeof user.badges === 'string' ? JSON.parse(user.badges) : user.badges || [],
      avatarInitials: user.avatar_initials,
      createdAt: user.created_at,
    };

    next();
  } catch (err) {
    return sendError(res, 'Authentication verification failed.', 500, err.message);
  }
}

export async function authenticateOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (decoded) {
    try {
      const { rows } = await query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      if (rows.length) {
        const user = rows[0];
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          studentId: user.student_id,
          role: user.role,
          reputation: user.reputation,
          institution: user.institution,
          subjects: typeof user.subjects === 'string' ? JSON.parse(user.subjects) : user.subjects || [],
          badges: typeof user.badges === 'string' ? JSON.parse(user.badges) : user.badges || [],
          avatarInitials: user.avatar_initials,
          createdAt: user.created_at,
        };
      }
    } catch (err) {
      // Ignore optional auth error
    }
  }

  next();
}
