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
  /** POST /auth/login */
  login: async ({ identifier, password }: Credentials) => {
    const res = await request<User & { token?: string }>("/auth/login", { method: "POST", body: { identifier, password } }, () => {
      const user = db.users.find(
        (u) => u.email.toLowerCase() === identifier.toLowerCase() || u.studentId.toLowerCase() === identifier.toLowerCase(),
      );
      if (!user) throw new Error("No institution account matches those details.");
      return user;
    });
    return persist(res.data);
  },

  /** Demo shortcut for the hackathon walkthrough. */
  loginAs: async (role: Role) => {
    const res = await request<User & { token?: string }>(`/auth/demo/${role}`, { method: "GET" }, () => {
      return db.users.find((u) => u.role === role) ?? db.users[0]!;
    });
    return persist(res.data);
  },

  /** POST /auth/register */
  register: async (payload: RegisterPayload) => {
    const res = await request<User & { token?: string }>("/auth/register", { method: "POST", body: payload }, () => {
      const user: User = {
        id: uid("u"),
        name: payload.name,
        email: payload.email,
        studentId: payload.studentId,
        role: payload.role,
        reputation: 0,
        subjects: [],
        badges: ["New Member"],
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

  /** POST /auth/forgot-password */
  forgotPassword: async (email: string) =>
    (await request<{ sent: boolean }>("/auth/forgot-password", { method: "POST", body: { email } }, () => ({ sent: true }))).data,

  /** POST /auth/logout */
  logout: async () => {
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
    tokenStore.clear();
  },

  /** GET /auth/me */
  currentUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  },
};
