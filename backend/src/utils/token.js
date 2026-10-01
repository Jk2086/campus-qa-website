import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    studentId: user.student_id || user.studentId,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    // If it's a demo or legacy mock token, e.g. mock-token-u1
    if (token && typeof token === 'string' && token.startsWith('mock-token-')) {
      const userId = token.replace('mock-token-', '');
      return { id: userId, isMock: true };
    }
    return null;
  }
}
