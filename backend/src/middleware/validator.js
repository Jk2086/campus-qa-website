import { sendError } from '../utils/response.js';
import { config } from '../config/env.js';

export function validateRegistration(req, res, next) {
  const { name, email, studentId, password, role } = req.body;

  if (!name || !email || !studentId || !password) {
    return sendError(res, 'All fields (name, email, studentId, password) are required.', 400);
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 'Invalid email address format.', 400);
  }

  // Institution domain validation if configured
  if (config.institutionDomain && !email.toLowerCase().endsWith(config.institutionDomain.toLowerCase())) {
    // Only warn/reject if domain enforcement is strict
    if (process.env.STRICT_INSTITUTION_DOMAIN === 'true') {
      return sendError(
        res,
        `Registration restricted to institution accounts ending with @${config.institutionDomain}`,
        400
      );
    }
  }

  if (password.length < 6) {
    return sendError(res, 'Password must be at least 6 characters long.', 400);
  }

  const validRoles = ['student', 'mentor', 'faculty', 'admin'];
  if (role && !validRoles.includes(role)) {
    return sendError(res, `Role must be one of: ${validRoles.join(', ')}`, 400);
  }

  next();
}

export function validateLogin(req, res, next) {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return sendError(res, 'Both identifier (email or student ID) and password are required.', 400);
  }
  next();
}

export function validateQuestion(req, res, next) {
  const { title, description, subject } = req.body;
  if (!title || title.trim().length < 5) {
    return sendError(res, 'Question title must be at least 5 characters long.', 400);
  }
  if (!description || description.trim().length < 10) {
    return sendError(res, 'Question description must be at least 10 characters long.', 400);
  }
  if (!subject) {
    return sendError(res, 'Subject is required.', 400);
  }
  next();
}

export function validateAnswer(req, res, next) {
  const { content } = req.body;
  if (!content || content.trim().length < 5) {
    return sendError(res, 'Answer content must be at least 5 characters long.', 400);
  }
  next();
}
