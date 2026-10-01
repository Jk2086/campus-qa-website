export type Role = "student" | "mentor" | "faculty" | "admin";

export type Subject =
  | "Computer Science"
  | "Biology"
  | "Biotechnology"
  | "Physics"
  | "Chemistry"
  | "Mathematics";

export const SUBJECTS: Subject[] = [
  "Computer Science",
  "Biology",
  "Biotechnology",
  "Physics",
  "Chemistry",
  "Mathematics",
];

export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string;
  role: Role;
  reputation: number;
  subjects: Subject[];
  badges: string[];
  avatarInitials: string;
  institution: string;
  createdAt: string;
}

export interface Question {
  id: string;
  authorId: string;
  title: string;
  description: string;
  subject: Subject;
  topic: string;
  tags: string[];
  status: "open" | "solved";
  upvotes: number;
  views: number;
  answerCount: number;
  createdAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  authorId: string;
  content: string;
  isAccepted: boolean;
  upvotes: number;
  createdAt: string;
  replies: { id: string; authorId: string; content: string; createdAt: string }[];
}

export interface MentorProfile {
  id: string;
  userId: string;
  expertise: Subject[];
  verified: boolean;
  helpfulAnswers: number;
  bio: string;
  responseTime: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: "answer" | "accepted" | "upvote" | "mentor" | "similar" | "report";
  message: string;
  questionId?: string;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  contentId: string;
  contentType: "question" | "answer";
  excerpt: string;
  reason: string;
  status: "pending" | "reviewing" | "removed" | "dismissed" | "warned";
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface QuestionQuery {
  search?: string;
  subject?: Subject | "all";
  tags?: string[];
  sort?: "recent" | "popular";
  status?: "all" | "open" | "solved" | "unanswered";
  authorId?: string;
  limit?: number;
}
