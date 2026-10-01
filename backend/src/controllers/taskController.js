import { Task } from '../models/Task.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const taskController = {
  /**
   * GET /tasks or /api/tasks
   */
  async getTasks(req, res) {
    try {
      const list = await Task.findAll();
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
};
