import { MentorProfile } from '../models/MentorProfile.js';
import { routingService } from '../services/routingService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const mentorController = {
  /**
   * GET /mentors or /api/mentors
   */
  async getMentors(req, res) {
    try {
      const { subject, search } = req.query;
      const list = await MentorProfile.findAll({ subject, search });
      return sendSuccess(res, list);
    } catch (err) {
      return sendError(res, 'Failed to fetch mentors', 500, err.message);
    }
  },

  /**
   * GET /mentors/:id or /api/mentors/:id
   */
  async getMentor(req, res) {
    try {
      const { id } = req.params;
      const mentor = await MentorProfile.findById(id);

      if (!mentor) {
        return sendError(res, 'Mentor not found', 404);
      }

      return sendSuccess(res, mentor);
    } catch (err) {
      return sendError(res, 'Failed to fetch mentor', 500, err.message);
    }
  },

  /**
   * GET /mentors/route or /api/mentors/route
   */
  async getRecommended(req, res) {
    try {
      const { subject, topic } = req.query;
      const matched = await routingService.findMentorsForQuestion({ subject, topic });
      return sendSuccess(res, matched);
    } catch (err) {
      return sendError(res, 'Failed to route mentors', 500, err.message);
    }
  },
};
