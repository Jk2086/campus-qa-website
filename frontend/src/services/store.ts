/**
 * In-memory mock database. Replaced entirely by the Antigravity backend later.
 */
import {
  mockAnswers,
  mockCampusResources,
  mockMentors,
  mockNotifications,
  mockQuestions,
  mockReports,
  mockTasks,
  mockUsers,
} from "./mock-data";
import type {
  Answer,
  CampusResource,
  CampusTask,
  MentorProfile,
  NotificationItem,
  Question,
  Report,
  User,
} from "./types";

export const db = {
  users: [...mockUsers] as User[],
  questions: [...mockQuestions] as Question[],
  answers: [...mockAnswers] as Answer[],
  mentors: [...mockMentors] as MentorProfile[],
  resources: [...mockCampusResources] as CampusResource[],
  tasks: [...mockTasks] as CampusTask[],
  notifications: [...mockNotifications] as NotificationItem[],
  reports: [...mockReports] as Report[],
  savedQuestionIds: ["q1", "q3"] as string[],
  votes: {} as Record<string, 1 | -1 | undefined>,
  drafts: [] as { id: string; title: string; description: string; savedAt: string }[],
};

export const findUser = (id?: string) => (id ? db.users.find((u) => u.id === id) : undefined);
export const findMentorByUserId = (userId?: string) =>
  userId ? db.mentors.find((m) => m.userId === userId) : undefined;
export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
