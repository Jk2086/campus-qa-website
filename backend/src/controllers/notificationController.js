import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const notificationController = {
  /**
   * GET /notifications or /api/notifications
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user ? req.user.id : (req.query.userId || 'u1');
      const list = await Notification.findByUserId(userId);
      return sendSuccess(res, list);
    } catch (err) {
      return sendError(res, 'Failed to fetch notifications', 500, err.message);
    }
  },

  /**
   * PUT /notifications/:id/read or /api/notifications/:id/read
   */
  async markRead(req, res) {
    try {
      const { id } = req.params;
      const updated = await Notification.markRead(id);
      return sendSuccess(res, updated, 'Notification marked as read');
    } catch (err) {
      return sendError(res, 'Failed to mark notification read', 500, err.message);
    }
  },

  /**
   * PUT /notifications/read-all or /api/notifications/read-all
   */
  async markAllRead(req, res) {
    try {
      const userId = req.user ? req.user.id : (req.body.userId || req.query.userId || 'u1');
      await Notification.markAllRead(userId);
      return sendSuccess(res, { read: true }, 'All notifications marked as read');
    } catch (err) {
      return sendError(res, 'Failed to mark all read', 500, err.message);
    }
  },
};
