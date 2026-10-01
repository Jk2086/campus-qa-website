import { aiService } from '../services/aiService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const aiController = {
  /**
   * POST /ai/hint or /api/ai/hint
   */
  async getHint(req, res) {
    try {
      const { questionId } = req.body;
      if (!questionId) {
        return sendError(res, 'questionId is required', 400);
      }

      const result = await aiService.getHint(questionId);
      return sendSuccess(res, result);
    } catch (err) {
      return sendError(res, 'Failed to generate hint', 500, err.message);
    }
  },

  /**
   * POST /ai/explain or /api/ai/explain
   */
  async explainConcept(req, res) {
    try {
      const { questionId } = req.body;
      if (!questionId) {
        return sendError(res, 'questionId is required', 400);
      }

      const result = await aiService.explainConcept(questionId);
      return sendSuccess(res, result);
    } catch (err) {
      return sendError(res, 'Failed to explain concept', 500, err.message);
    }
  },

  /**
   * POST /ai/similar-questions or /api/ai/similar-questions
   */
  async relatedQuestions(req, res) {
    try {
      const { questionId } = req.body;
      if (!questionId) {
        return sendError(res, 'questionId is required', 400);
      }

      const questions = await aiService.getRelatedQuestions(questionId);
      return sendSuccess(res, questions);
    } catch (err) {
      return sendError(res, 'Failed to fetch related questions', 500, err.message);
    }
  },

  /**
   * POST /ai/query or /api/ai/query
   * Full Answer -> Guide -> Connect pipeline
   */
  async processQuery(req, res) {
    try {
      const { query, subject, questionId } = req.body;
      if (!query || query.trim() === '') {
        return sendError(res, 'Query text is required', 400);
      }

      const result = await aiService.processQuery({ query, subject, questionId });
      return sendSuccess(res, result);
    } catch (err) {
      return sendError(res, 'Failed to process AI query', 500, err.message);
    }
  },

  /**
   * POST /ai/classify or /api/ai/classify
   */
  async classify(req, res) {
    try {
      const { text } = req.body;
      const category = aiService.classifyIntent(text || '');
      return sendSuccess(res, { category });
    } catch (err) {
      return sendError(res, 'Classification failed', 500, err.message);
    }
  },
};
