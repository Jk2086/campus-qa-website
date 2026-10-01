import { KnowledgeBase } from '../models/KnowledgeBase.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const knowledgeController = {
  /**
   * GET /knowledge or /api/knowledge
   */
  async getKnowledge(req, res) {
    try {
      const { subject, limit } = req.query;
      const list = await KnowledgeBase.findAll({ subject, limit });
      return sendSuccess(res, list);
    } catch (err) {
      return sendError(res, 'Failed to fetch knowledge base', 500, err.message);
    }
  },

  /**
   * GET /knowledge/search or /api/knowledge/search
   */
  async searchKnowledge(req, res) {
    try {
      const { q, subject } = req.query;
      const list = await KnowledgeBase.search(q || '', subject);
      return sendSuccess(res, list);
    } catch (err) {
      return sendError(res, 'Knowledge search failed', 500, err.message);
    }
  },

  /**
   * POST /knowledge or /api/knowledge
   */
  async createKnowledge(req, res) {
    try {
      const id = `kb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const verifiedBy = req.user ? req.user.id : (req.body.verifiedBy || 'u2');
      const created = await KnowledgeBase.create({ id, ...req.body, verifiedBy });
      return sendSuccess(res, created, 'Knowledge base item added', 201);
    } catch (err) {
      return sendError(res, 'Failed to create knowledge base entry', 500, err.message);
    }
  },
};
