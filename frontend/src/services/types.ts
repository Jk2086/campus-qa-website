export type Role = "student" | "mentor" | "faculty" | "admin";

export type Subject =
  | "Computer Science"
  | "Biology"
  | "Biotechnology"
  | "Physics"
  | "Chemistry"
  | "Mathematics"
  | "Electronics"
  | "Mechanical";

export const SUBJECTS: Subject[] = [
  "Computer Science",
  "Biology",
  "Biotechnology",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Electronics",
  "Mechanical",
];

export type ResponseType =
  | "quick"
  | "verified_campus"
  | "ai_suggested"
  | "peer"
  | "faculty_verified"
  | "campus_guidance"
  | "task_guidance"
  | "human_requested"
  | "ai_uncertain";

export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string;
  role: Role;
  department: string;
  year?: string;
  reputation: number;
  subjects: Subject[];
  badges: string[];
  avatarInitials: string;
  institution: string;
  bio?: string;
  availability?: "available" | "busy" | "in_class" | "offline";
  createdAt: string;
}

export interface TaskStep {
  id: string;
  title: string;
  completed: boolean;
  guidance?: string;
}

export interface CampusTask {
  id: string;
  title: string;
  category: string;
  department?: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed";
  steps: TaskStep[];
  description: string;
}

export interface CampusResource {
  id: string;
  name: string;
  type: "office" | "coordinator" | "library" | "lab" | "placement" | "student_affairs" | "mentor";
  department: string;
  location: string;
  contactPerson: string;
  email: string;
  phone: string;
  workingHours: string;
  description: string;
  tags: string[];
}

export interface QuestionHelper {
  id: string;
  name: string;
  role: Role;
  department: string;
  status: "notified" | "viewed" | "answering";
}

export interface InstantAssistance {
  mode: "verified" | "ai_suggested" | "uncertain" | "guidance" | "task";
  title: string;
  content: string;
  responseType: ResponseType;
  concepts?: string[];
  hints?: string[];
  studyResources?: { title: string; url?: string; type: string }[];
  recommendedMentorId?: string;
  recommendedFacultyId?: string;
  campusResource?: CampusResource;
  taskSteps?: TaskStep[];
  humanHelpRequested?: boolean;
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
  isUrgent?: boolean;
  attachmentName?: string;
  upvotes: number;
  views: number;
  answerCount: number;
  createdAt: string;
  instantAssistance?: InstantAssistance;
  notifiedHelpers?: QuestionHelper[];
  savedBy?: string[];
}

export interface AnswerReply {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  authorId: string;
  content: string;
  answerType: ResponseType;
  isAccepted: boolean;
  isFacultyVerified?: boolean;
  verifiedBy?: string; // Faculty user ID
  verifiedByName?: string;
  verifiedAt?: string;
  upvotes: number;
  downvotes?: number;
  createdAt: string;
  replies: AnswerReply[];
}

export interface MentorProfile {
  id: string;
  userId: string;
  expertise: Subject[];
  department: string;
  verified: boolean;
  helpfulAnswers: number;
  answersGiven: number;
  bio: string;
  responseTime: string;
  availability: "available" | "busy" | "in_class" | "offline";
}

export interface NotificationItem {
  id: string;
  userId: string;
  type:
    | "answer"
    | "accepted"
    | "faculty_verification"
    | "mentor_request"
    | "urgent_question"
    | "relevant_question"
    | "mention"
    | "moderation_action"
    | "announcement";
  message: string;
  questionId?: string;
  read: boolean;
  createdAt: string;
}

export type ReportReason =
  | "spam"
  | "harassment"
  | "irrelevant"
  | "inappropriate"
  | "misinformation"
  | "other";

export interface Report {
  id: string;
  reporterId: string;
  contentId: string;
  contentType: "question" | "answer";
  excerpt: string;
  reason: ReportReason;
  customDetails?: string;
  status: "pending" | "reviewing" | "removed" | "dismissed" | "warned";
  resolvedBy?: string;
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
  department?: string;
  year?: string;
  tags?: string[];
  sort?: "recent" | "popular";
  status?: "all" | "open" | "solved" | "unanswered";
  verifiedOnly?: boolean;
  isUrgent?: boolean;
  authorId?: string;
  limit?: number;
}
