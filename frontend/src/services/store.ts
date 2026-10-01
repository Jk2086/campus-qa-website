/**
 * In-memory mock database. Replaced entirely by the Antigravity backend later.
 */
import {
  mockAnswers,
  mockMentors,
  mockNotifications,
  mockQuestions,
  mockReports,
  mockUsers,
} from "./mock-data";
import type { Answer, MentorProfile, NotificationItem, Question, Report, User } from "./types";

export const db = {
  users: [...mockUsers] as User[],
  questions: [...mockQuestions] as Question[],
  answers: [...mockAnswers] as Answer[],
  mentors: [...mockMentors] as MentorProfile[],
  notifications: [...mockNotifications] as NotificationItem[],
  reports: [...mockReports] as Report[],
  savedQuestionIds: ["q3", "q10"] as string[],
  votes: {} as Record<string, 1 | -1 | undefined>,
  drafts: [] as { id: string; title: string; description: string; savedAt: string }[],
};

export const findUser = (id: string) => db.users.find((u) => u.id === id);
export const uid = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 9)}`;
