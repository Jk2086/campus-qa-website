import { Question } from '../models/Question.js';
import { Report } from '../models/Report.js';
import { routingService } from '../services/routingService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const questionController = {
  /**
   * GET /questions or /api/questions
   */
  async getQuestions(req, res) {
    try {
      const queryParams = {
        search: req.query.search || req.query.q,
        subject: req.query.subject,
        tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) : undefined,
        sort: req.query.sort,
        status: req.query.status,
        authorId: req.query.authorId,
        limit: req.query.limit,
      };

      const questions = await Question.findAll(queryParams);
      return sendSuccess(res, questions);
    } catch (err) {
      return sendError(res, 'Failed to fetch questions', 500, err.message);
    }
  },

  /**
   * GET /questions/:id or /api/questions/:id
   */
  async getQuestion(req, res) {
    try {
      const { id } = req.params;
      const question = await Question.findById(id);

      if (!question) {
        return sendError(res, 'Question not found', 404);
      }

      // Increment views count asynchronously
      Question.incrementViews(id).catch(console.error);

      return sendSuccess(res, question);
    } catch (err) {
      return sendError(res, 'Failed to fetch question', 500, err.message);
    }
  },

  /**
   * GET /questions/search or /api/questions/search
   */
  async searchQuestions(req, res) {
    try {
      const term = req.query.q || req.query.search || '';
      const questions = await Question.findAll({ search: term, ...req.query });
      return sendSuccess(res, questions);
    } catch (err) {
      return sendError(res, 'Search failed', 500, err.message);
    }
  },

  /**
   * GET /questions/similar or /api/questions/similar
   */
  async getSimilarQuestions(req, res) {
    try {
      const { title, questionId, subject } = req.query;
      const similar = await Question.getSimilar({ title, questionId, subject });
      return sendSuccess(res, similar);
    } catch (err) {
      return sendError(res, 'Failed to find similar questions', 500, err.message);
    }
  },

  /**
   * POST /questions or /api/questions
   */
  async createQuestion(req, res) {
    try {
      const { title, description, subject, topic, tags = [], attachmentName, authorId, urgency = 'normal' } = req.body;
      const effectiveAuthorId = req.user ? req.user.id : authorId;

      if (!effectiveAuthorId) {
        return sendError(res, 'Author ID is required', 400);
      }

      const id = `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const created = await Question.create({
        id,
        authorId: effectiveAuthorId,
        title,
        description,
        subject,
        topic: topic || tags[0] || subject,
        tags,
        attachmentName,
        urgency,
      });

      // Trigger automatic smart routing to relevant peer mentors & faculty in background
      routingService.routeQuestion(created, urgency === 'urgent').catch((err) => {
        console.warn('Smart mentor routing error:', err.message);
      });

      return sendSuccess(res, created, 'Question created successfully', 201);
    } catch (err) {
      return sendError(res, 'Failed to create question', 500, err.message);
    }
  },

  /**
   * PUT /questions/:id or /api/questions/:id
   */
  async updateQuestion(req, res) {
    try {
      const { id } = req.params;
      const existing = await Question.findById(id);

      if (!existing) {
        return sendError(res, 'Question not found', 404);
      }

      // Check authorization (author or admin)
      if (req.user && req.user.role !== 'admin' && req.user.id !== existing.authorId) {
        return sendError(res, 'You can only edit your own questions.', 403);
      }

      const updated = await Question.update(id, req.body);
      return sendSuccess(res, updated, 'Question updated successfully');
    } catch (err) {
      return sendError(res, 'Failed to update question', 500, err.message);
    }
  },

  /**
   * DELETE /questions/:id or /api/questions/:id
   */
  async deleteQuestion(req, res) {
    try {
      const { id } = req.params;
      const existing = await Question.findById(id);

      if (!existing) {
        return sendError(res, 'Question not found', 404);
      }

      if (req.user && req.user.role !== 'admin' && req.user.id !== existing.authorId) {
        return sendError(res, 'You can only delete your own questions.', 403);
      }

      await Question.delete(id);
      return sendSuccess(res, { deleted: true }, 'Question deleted successfully');
    } catch (err) {
      return sendError(res, 'Failed to delete question', 500, err.message);
    }
  },

  /**
   * POST /questions/:id/urgent or /api/questions/:id/urgent
   */
  async markUrgent(req, res) {
    try {
      const { id } = req.params;
      const question = await Question.markUrgent(id);

      if (!question) {
        return sendError(res, 'Question not found', 404);
      }

      // Alert mentors with urgent priority
      await routingService.routeQuestion(question, true);

      return sendSuccess(res, question, 'Question prioritized and routed to campus mentors.');
    } catch (err) {
      return sendError(res, 'Failed to mark question urgent', 500, err.message);
    }
  },

  /**
   * POST /questions/:id/save or toggleSaved
   */
  async toggleSaved(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.id : (req.body.userId || 'u1');

      const isSaved = await Question.toggleSaved(userId, id);
      return sendSuccess(res, isSaved, isSaved ? 'Question saved to library' : 'Question removed from saved');
    } catch (err) {
      return sendError(res, 'Failed to toggle save status', 500, err.message);
    }
  },

  /**
   * GET /me/saved or /api/me/saved
   */
  async getSaved(req, res) {
    try {
      const userId = req.user ? req.user.id : (req.query.userId || 'u1');
      const saved = await Question.getSaved(userId);
      return sendSuccess(res, saved);
    } catch (err) {
      return sendError(res, 'Failed to retrieve saved questions', 500, err.message);
    }
  },

  /**
   * GET /topics/popular or /api/topics/popular
   */
  async getPopularTopics(req, res) {
    try {
      const topics = await Question.getPopularTopics();
      return sendSuccess(res, topics);
    } catch (err) {
      return sendError(res, 'Failed to fetch popular topics', 500, err.message);
    }
  },

  /**
   * POST /questions/:id/report or /api/questions/:id/report
   */
  async reportQuestion(req, res) {
    try {
      const { id } = req.params;
      const { reason = 'Flagged content', excerpt = '' } = req.body;
      const reporterId = req.user ? req.user.id : (req.body.reporterId || 'u1');

      const question = await Question.findById(id);
      if (!question) {
        return sendError(res, 'Question not found', 404);
      }

      const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const report = await Report.create({
        id: reportId,
        reporterId,
        contentId: id,
        contentType: 'question',
        excerpt: excerpt || question.title,
        reason,
      });

      return sendSuccess(res, report, 'Question reported for review.');
    } catch (err) {
      return sendError(res, 'Failed to report question', 500, err.message);
    }
  },
};
