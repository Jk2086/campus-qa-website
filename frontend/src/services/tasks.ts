/**
 * Campus Task Guidance service (/api/tasks)
 */
import { request } from "./client";
import { db } from "./store";
import type { CampusTask } from "./types";

export const tasks = {
  /** GET /api/tasks */
  getTasks: async (params?: { category?: string; status?: string }) =>
    (
      await request<CampusTask[]>("/tasks", { query: params }, () => {
        let list = [...db.tasks];
        if (params?.category && params.category !== "all") {
          list = list.filter((t) => t.category === params.category);
        }
        if (params?.status && params.status !== "all") {
          list = list.filter((t) => t.status === params.status);
        }
        return list;
      })
    ).data,

  /** GET /api/tasks/:id */
  getTaskById: async (id: string) =>
    (
      await request<CampusTask | undefined>(`/tasks/${id}`, {}, () =>
        db.tasks.find((t) => t.id === id),
      )
    ).data,

  /** POST /api/tasks/:id/step/:stepId/toggle */
  toggleStep: async (taskId: string, stepId: string) =>
    (
      await request<CampusTask>(`/tasks/${taskId}/step/${stepId}/toggle`, { method: "POST" }, () => {
        const task = db.tasks.find((t) => t.id === taskId);
        if (!task) throw new Error("Task not found");
        const step = task.steps.find((s) => s.id === stepId);
        if (step) {
          step.completed = !step.completed;
          const allDone = task.steps.every((s) => s.completed);
          const anyDone = task.steps.some((s) => s.completed);
          task.status = allDone ? "completed" : anyDone ? "in_progress" : "pending";
        }
        return task;
      })
    ).data,
};
