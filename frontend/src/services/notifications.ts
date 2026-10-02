import { request } from "./client";
import { db } from "./store";
import type { NotificationItem } from "./types";

export const notifications = {
  /** GET /api/notifications */
  getNotifications: async (userId: string, type?: string) =>
    (
      await request<NotificationItem[]>("/notifications", { query: { userId, type } }, () => {
        let items = db.notifications.filter((n) => n.userId === userId || n.userId === "all");
        if (items.length === 0) {
          items = [...db.notifications];
        }
        if (type && type !== "all") {
          items = items.filter((n) => n.type === type);
        }
        return items;
      })
    ).data,

  /** PUT /api/notifications/:id/read */
  markRead: async (id: string) => {
    const n = db.notifications.find((item) => item.id === id);
    if (n) n.read = true;
    return n;
  },

  /** PUT /api/notifications/read-all */
  markAllRead: async (userId: string) => {
    db.notifications
      .filter((n) => n.userId === userId || n.userId === "all" || n.userId === "u1")
      .forEach((n) => (n.read = true));
    return true;
  },
};
