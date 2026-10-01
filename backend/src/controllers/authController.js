import bcrypt from 'bcryptjs';
import { User, formatUser } from '../models/User.js';
import { generateToken } from '../utils/token.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const authController = {
  /**
   * POST /auth/login or /api/auth/login
   */
  async login(req, res) {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return sendError(res, 'Please provide email/student ID and password.', 400);
      }

      const user = await User.findByEmailOrStudentId(identifier);
      if (!user) {
        return sendError(res, 'No institution account matches those details.', 401);
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return sendError(res, 'Invalid credentials. Please verify your password.', 401);
      }

      const formatted = formatUser(user);
      const token = generateToken(formatted);
      const userWithToken = { ...formatted, token };

      return sendSuccess(res, userWithToken, 'Login successful', 200, { token });
    } catch (err) {
      return sendError(res, 'Login failed', 500, err.message);
    }
  },

  /**
   * POST /auth/register or /api/auth/register
   */
  async register(req, res) {
    try {
      const { name, email, studentId, password, role = 'student' } = req.body;

      // Check if user already exists
      const existing = await User.findByEmailOrStudentId(email);
      if (existing) {
        return sendError(res, 'An account with that email or student ID already exists.', 400);
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const id = `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const avatarInitials = name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const created = await User.create({
        id,
        name,
        email,
        studentId,
        passwordHash,
        role,
        avatarInitials,
      });

      const formatted = formatUser(created);
      const token = generateToken(formatted);
      const userWithToken = { ...formatted, token };

      return sendSuccess(res, userWithToken, 'Registration successful', 201, { token });
    } catch (err) {
      return sendError(res, 'Registration failed', 500, err.message);
    }
  },

  /**
   * Demo quick-login shortcut for hackathon walkthrough
   * POST /auth/demo-login or GET /auth/demo/:role
   */
  async demoLogin(req, res) {
    try {
      const role = req.body?.role || req.params?.role || 'student';
      const users = await User.findByRole(role);
      const user = users[0] || (await User.findById('u1'));

      if (!user) {
        return sendError(res, `No demo user available for role: ${role}`, 404);
      }

      const token = generateToken(user);
      const userWithToken = { ...user, token };

      return sendSuccess(res, userWithToken, `Logged in as demo ${role}`, 200, { token });
    } catch (err) {
      return sendError(res, 'Demo login failed', 500, err.message);
    }
  },

  /**
   * POST /auth/forgot-password or /api/auth/forgot-password
   */
  async forgotPassword(req, res) {
    return sendSuccess(res, { sent: true }, 'Password reset instructions dispatched if account exists.');
  },

  /**
   * POST /auth/logout or /api/auth/logout
   */
  async logout(req, res) {
    return sendSuccess(res, { loggedOut: true }, 'Logged out successfully');
  },

  /**
   * GET /auth/me or GET /users/me
   */
  async getMe(req, res) {
    if (!req.user) {
      return sendError(res, 'Not authenticated', 401);
    }
    return sendSuccess(res, req.user);
  },

  /**
   * PUT /users/me
   */
  async updateMe(req, res) {
    if (!req.user) {
      return sendError(res, 'Not authenticated', 401);
    }
    try {
      const updated = await User.update(req.user.id, req.body);
      return sendSuccess(res, formatUser(updated), 'Profile updated successfully');
    } catch (err) {
      return sendError(res, 'Failed to update profile', 500, err.message);
    }
  },
};
