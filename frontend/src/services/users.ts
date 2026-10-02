/**
 * Users service (/api/users)
 */
import { request } from "./client";
import { db, findUser } from "./store";
import type { User } from "./types";

export const users = {
  /** GET /api/users */
  getUsers: async (params?: { role?: string; department?: string }) =>
    (
      await request<User[]>("/users", { query: params }, () => {
        let list = [...db.users];
        if (params?.role && params.role !== "all") {
          list = list.filter((u) => u.role === params.role);
        }
        if (params?.department && params.department !== "all") {
          list = list.filter((u) => u.department === params.department);
        }
        return list;
      })
    ).data,

  /** GET /api/users/:id */
  getUserById: async (id: string) =>
    (
      await request<User | undefined>(`/users/${id}`, {}, () => findUser(id))
    ).data,

  /** PATCH /api/users/:id/availability */
  updateAvailability: async (id: string, availability: "available" | "busy" | "in_class" | "offline") =>
    (
      await request<User>(`/users/${id}/availability`, { method: "PATCH", body: { availability } }, () => {
        const u = findUser(id);
        if (!u) throw new Error("User not found");
        u.availability = availability;
        const mentor = db.mentors.find((m) => m.userId === id);
        if (mentor) mentor.availability = availability;
        return u;
      })
    ).data,
};
