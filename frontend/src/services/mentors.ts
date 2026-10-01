import { request } from "./client";
import { db, findUser } from "./store";
import type { MentorProfile, User } from "./types";

export type MentorWithUser = MentorProfile & { user: User };

const hydrate = (m: MentorProfile): MentorWithUser => ({ ...m, user: findUser(m.userId)! });

export const mentors = {
  /** GET /mentors */
  getMentors: async (filters: { subject?: string; search?: string } = {}) =>
    (
      await request<MentorWithUser[]>("/mentors", { query: filters }, () =>
        db.mentors
          .map(hydrate)
          .filter((m) => (filters.subject && filters.subject !== "all" ? m.expertise.includes(filters.subject as never) : true))
          .filter((m) =>
            filters.search ? m.user.name.toLowerCase().includes(filters.search.toLowerCase()) : true,
          )
          .sort((a, b) => b.user.reputation - a.user.reputation),
      )
    ).data,

  /** GET /mentors/:id */
  getMentor: async (id: string) =>
    (
      await request<MentorWithUser>(`/mentors/${id}`, {}, () => {
        const m = db.mentors.find((item) => item.id === id);
        if (!m) throw new Error("Mentor not found");
        return hydrate(m);
      })
    ).data,
};
