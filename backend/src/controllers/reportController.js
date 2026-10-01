import { Report } from '../models/Report.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const reportController = {
  /**
   * POST /reports or /api/reports
   */
  async createReport(req, res) {
    try {
      const { reporterId, contentId, contentType, excerpt, reason } = req.body;
      const effectiveReporterId = req.user ? req.user.id : (reporterId || 'u1');

      if (!contentId || !contentType || !reason) {
        return sendError(res, 'contentId, contentType, and reason are required', 400);
      }

      const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const created = await Report.create({
        id,
        reporterId: effectiveReporterId,
        contentId,
        contentType,
        excerpt: excerpt || '',
        reason,
      });

      return sendSuccess(res, created, 'Report submitted for review', 201);
    } catch (err) {
      return sendError(res, 'Failed to create report', 500, err.message);
    }
  },

  /**
   * POST /users/:id/report
   */
  async reportUser(req, res) {
    try {
      const { id: reportedUserId } = req.params;
      const { reason = 'Inappropriate behavior', excerpt = '' } = req.body;
      const reporterId = req.user ? req.user.id : (req.body.reporterId || 'u1');

      const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const created = await Report.create({
        id,
        reporterId,
        contentId: reportedUserId,
        contentType: 'user',
        excerpt: excerpt || `User ID ${reportedUserId}`,
        reason,
      });

      return sendSuccess(res, created, 'User reported for administrative review', 201);
    } catch (err) {
      return sendError(res, 'Failed to report user', 500, err.message);
    }
  },

  /**
   * GET /admin/reports or /api/moderation/reports
   */
  async getReports(req, res) {
    try {
      const list = await Report.findAll();
      return sendSuccess(res, list);
    } catch (err) {
      return sendError(res, 'Failed to fetch reports', 500, err.message);
    }
  },

  /**
   * PUT /admin/reports/:id or /api/moderation/reports/:id
   */
  async updateReport(req, res) {
    try {
      const { id } = req.params;
      const { status, actionTaken = '' } = req.body;

      if (!status) {
        return sendError(res, 'Status is required', 400);
      }

      const validStatuses = ['pending', 'reviewing', 'removed', 'dismissed', 'warned'];
      if (!validStatuses.includes(status)) {
        return sendError(res, `Status must be one of: ${validStatuses.join(', ')}`, 400);
      }

      const reviewerId = req.user ? req.user.id : 'u8';
      const updated = await Report.updateStatus(id, status, reviewerId, actionTaken);

      if (!updated) {
        return sendError(res, 'Report not found', 404);
      }

      return sendSuccess(res, updated, `Report status updated to ${status}`);
    } catch (err) {
      return sendError(res, 'Failed to update report', 500, err.message);
    }
  },

  /**
   * GET /moderation/logs
   */
  async getLogs(req, res) {
    try {
      const logs = await Report.getLogs();
      return sendSuccess(res, logs);
    } catch (err) {
      return sendError(res, 'Failed to fetch moderation logs', 500, err.message);
    }
  },
};
