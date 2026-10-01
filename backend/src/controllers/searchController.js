import { searchService } from '../services/searchService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const searchController = {
  /**
   * GET /search or /api/search
   */
  async search(req, res) {
    try {
      const term = req.query.q || req.query.query || req.query.search || '';
      const results = await searchService.searchAll(term);
      return sendSuccess(res, results);
    } catch (err) {
      return sendError(res, 'Global search failed', 500, err.message);
    }
  },
};
