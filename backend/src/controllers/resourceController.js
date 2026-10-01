import { CampusResource } from '../models/CampusResource.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const resourceController = {
  /**
   * GET /resources or /api/resources
   */
  async getResources(req, res) {
    try {
      const { type, department, search } = req.query;
      const list = await CampusResource.findAll({ type, department, search });
      return sendSuccess(res, list);
    } catch (err) {
      return sendError(res, 'Failed to fetch campus resources', 500, err.message);
    }
  },

  /**
   * GET /resources/:id or /api/resources/:id
   */
  async getResource(req, res) {
    try {
      const { id } = req.params;
      const resource = await CampusResource.findById(id);

      if (!resource) {
        return sendError(res, 'Campus resource not found', 404);
      }

      return sendSuccess(res, resource);
    } catch (err) {
      return sendError(res, 'Failed to fetch campus resource', 500, err.message);
    }
  },

  /**
   * POST /resources or /api/resources
   */
  async createResource(req, res) {
    try {
      const id = `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const created = await CampusResource.create({ id, ...req.body });
      return sendSuccess(res, created, 'Campus resource created', 201);
    } catch (err) {
      return sendError(res, 'Failed to create resource', 500, err.message);
    }
  },
};
