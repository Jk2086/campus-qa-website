import { request } from "./client";
import { db } from "./store";
import type { NotificationItem } from "./types";

export const notifications = {
  /** GET /notifications */
  getNotifications: async (userId: string) =>
    (
      await request<NotificationItem[]>("/notifications", { query: { userId } }, () =>
        db.notifications.filter((n) => n.userId === userId || n.userId === "u1"),
      )
    ).data,

  /** PUT /notifications/:id/read */
  markRead: async (id: string) => {
    const n = db.notifications.find((item) => item.id === id);
    if (n) n.read = true;
    return n;
  },

  /** PUT /notifications/read-all */
  markAllRead: async (userId: string) => {
    db.notifications.filter((n) => n.userId === userId || n.userId === "u1").forEach((n) => (n.read = true));
    return true;
  },
};
