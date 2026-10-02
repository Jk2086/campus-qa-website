import { User, formatUser } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const userController = {
  /**
   * GET /users or /api/users
   */
  async getUsers(req, res) {
    try {
      const { role, department } = req.query;
      const list = await User.findAll({ role, department });
      return sendSuccess(res, list);
    } catch (err) {
      return sendError(res, 'Failed to fetch users', 500, err.message);
    }
  },

  /**
   * GET /users/:id or /api/users/:id
   */
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }
      return sendSuccess(res, user);
    } catch (err) {
      return sendError(res, 'Failed to fetch user', 500, err.message);
    }
  },

  /**
   * PATCH /users/:id/availability or /api/users/:id/availability
   */
  async updateAvailability(req, res) {
    try {
      const { id } = req.params;
      const { availability } = req.body;
      if (!availability) {
        return sendError(res, 'Availability status is required', 400);
      }
      const updated = await User.updateAvailability(id, availability);
      if (!updated) {
        return sendError(res, 'User not found', 404);
      }
      return sendSuccess(res, updated, 'Availability updated successfully');
    } catch (err) {
      return sendError(res, 'Failed to update availability', 500, err.message);
    }
  },
};
