import { Vote } from '../models/Vote.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const voteController = {
  /**
   * POST /votes or /api/votes
   */
  async vote(req, res) {
    try {
      const { contentId, contentType, voteType = 1 } = req.body;
      const userId = req.user ? req.user.id : (req.body.userId || 'u1');

      if (!contentId || !contentType) {
        return sendError(res, 'contentId and contentType are required.', 400);
      }

      if (!['question', 'answer'].includes(contentType)) {
        return sendError(res, 'contentType must be either "question" or "answer".', 400);
      }

      const result = await Vote.vote({
        userId,
        contentId,
        contentType,
        voteType: parseInt(voteType, 10),
      });

      return sendSuccess(res, result);
    } catch (err) {
      return sendError(res, 'Failed to process vote', 500, err.message);
    }
  },
};
