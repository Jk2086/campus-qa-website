import { request, tokenStore } from "./client";
import { db, uid } from "./store";
import type { Role, User } from "./types";

const SESSION_KEY = "campusqa.user";

export interface Credentials {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  studentId: string;
  department?: string;
  year?: string;
  password: string;
  role: Role;
}

const persist = (user: User & { token?: string }) => {
  if (typeof window !== "undefined") localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (user.token) {
    tokenStore.set(user.token);
  } else {
    tokenStore.set(`mock-token-${user.id}`);
  }
  return user;
};

export const auth = {
  /** POST /api/auth/login */
  login: async ({ identifier, password }: Credentials) => {
    const res = await request<User & { token?: string }>("/auth/login", { method: "POST", body: { identifier, password } }, () => {
      const user = db.users.find(
        (u) =>
          u.email.toLowerCase() === identifier.toLowerCase() ||
          u.studentId.toLowerCase() === identifier.toLowerCase(),
      );
      if (!user) throw new Error("No institution account matches those details. (Demo password: campus2026)");
      return user;
    });
    return persist(res.data);
  },

  /** Demo shortcut for Hackathon role-switching walkthrough. */
  loginAs: async (role: Role) => {
    const res = await request<User & { token?: string }>(`/auth/demo/${role}`, { method: "GET" }, () => {
      if (role === "student") return db.users.find((u) => u.id === "u1") ?? db.users[0]!;
      if (role === "mentor") return db.users.find((u) => u.id === "u5") ?? db.users[2]!;
      if (role === "faculty") return db.users.find((u) => u.id === "u2") ?? db.users[1]!;
      if (role === "admin") return db.users.find((u) => u.id === "u9") ?? db.users[7]!;
      return db.users[0]!;
    });
    return persist(res.data);
  },

  /** POST /api/auth/register */
  register: async (payload: RegisterPayload) => {
    const res = await request<User & { token?: string }>("/auth/register", { method: "POST", body: payload }, () => {
      const user: User = {
        id: uid("u"),
        name: payload.name,
        email: payload.email,
        studentId: payload.studentId,
        role: payload.role,
        department: payload.department ?? "General Engineering",
        year: payload.year ?? "1st Year",
        reputation: 10,
        subjects: [],
        badges: ["Verified Student", "New Member"],
        avatarInitials: payload.name
          .split(" ")
          .map((p) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        institution: "Northfield Institute of Technology",
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      return user;
    });
    return persist(res.data);
  },

  /** POST /api/auth/forgot-password */
  forgotPassword: async (email: string) =>
    (await request<{ sent: boolean }>("/auth/forgot-password", { method: "POST", body: { email } }, () => ({ sent: true }))).data,

  /** POST /api/auth/logout */
  logout: async () => {
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
    tokenStore.clear();
  },

  /** GET /api/auth/me */
  currentUser: (): User | null => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        try {
          return JSON.parse(raw) as User;
        } catch {
          return null;
        }
      }
    }
    // Default to student user for seamless demo evaluation
    return db.users[0] ?? null;
  },
};
