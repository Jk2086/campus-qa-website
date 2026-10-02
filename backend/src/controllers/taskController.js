import { Task } from '../models/Task.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const taskController = {
  /**
   * GET /tasks or /api/tasks
   */
  async getTasks(req, res) {
    try {
      const { category, status } = req.query;
      const list = await Task.findAll({ category, status });
      return sendSuccess(res, list);
    } catch (err) {
      return sendError(res, 'Failed to fetch tasks', 500, err.message);
    }
  },

  /**
   * GET /tasks/:id or /api/tasks/:id
   */
  async getTask(req, res) {
    try {
      const { id } = req.params;
      const task = await Task.findById(id);

      if (!task) {
        return sendError(res, 'Task not found', 404);
      }

      return sendSuccess(res, task);
    } catch (err) {
      return sendError(res, 'Failed to fetch task', 500, err.message);
    }
  },

  /**
   * POST /tasks/:id/step/:stepId/toggle or /api/tasks/:id/step/:stepId/toggle
   */
  async toggleStep(req, res) {
    try {
      const { id, stepId } = req.params;
      const updated = await Task.toggleStep(id, stepId);

      if (!updated) {
        return sendError(res, 'Task or step not found', 404);
      }

      return sendSuccess(res, updated, 'Step completion toggled successfully');
    } catch (err) {
      return sendError(res, 'Failed to toggle task step', 500, err.message);
    }
  },
};
