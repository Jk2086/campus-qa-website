/**
 * Multi-domain campus search service (/api/search)
 */
import { request } from "./client";
import { db } from "./store";
import type { CampusResource, MentorProfile, Question, Subject } from "./types";

export interface SearchResults {
  questions: Question[];
  resources: CampusResource[];
  mentors: (MentorProfile & { user?: (typeof db.users)[0] })[];
  topics: { label: string; count: number }[];
}

export const search = {
  /** GET /api/search */
  query: async (params: {
    q: string;
    subject?: Subject | "all";
    department?: string;
    status?: string;
    verifiedOnly?: boolean;
    sort?: "recent" | "popular";
  }): Promise<SearchResults> =>
    (
      await request<SearchResults>("/search", { query: params }, () => {
        const queryText = (params.q ?? "").trim().toLowerCase();

        let questionResults = [...db.questions];

        if (queryText) {
          questionResults = questionResults.filter(
            (q) =>
              q.title.toLowerCase().includes(queryText) ||
              q.description.toLowerCase().includes(queryText) ||
              q.topic.toLowerCase().includes(queryText) ||
              q.tags.some((t) => t.toLowerCase().includes(queryText)),
          );
        }

        if (params.subject && params.subject !== "all") {
          questionResults = questionResults.filter((q) => q.subject === params.subject);
        }

        if (params.status && params.status !== "all") {
          if (params.status === "unanswered") {
            questionResults = questionResults.filter((q) => q.answerCount === 0);
          } else {
            questionResults = questionResults.filter((q) => q.status === params.status);
          }
        }

        if (params.verifiedOnly) {
          questionResults = questionResults.filter(
            (q) =>
              q.instantAssistance?.responseType === "verified_campus" ||
              q.instantAssistance?.responseType === "faculty_verified" ||
              db.answers.some((a) => a.questionId === q.id && a.isFacultyVerified),
          );
        }

        if (params.sort === "popular") {
          questionResults.sort((a, b) => b.upvotes - a.upvotes);
        } else {
          questionResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        // Search campus resources
        let resourceResults = [...db.resources];
        if (queryText) {
          resourceResults = resourceResults.filter(
            (r) =>
              r.name.toLowerCase().includes(queryText) ||
              r.description.toLowerCase().includes(queryText) ||
              r.location.toLowerCase().includes(queryText) ||
              r.tags.some((t) => t.toLowerCase().includes(queryText)),
          );
        }

        // Search mentors
        let mentorResults = db.mentors.map((m) => ({
          ...m,
          user: db.users.find((u) => u.id === m.userId),
        }));
        if (queryText) {
          mentorResults = mentorResults.filter(
            (m) =>
              m.user?.name.toLowerCase().includes(queryText) ||
              m.bio.toLowerCase().includes(queryText) ||
              m.expertise.some((e) => e.toLowerCase().includes(queryText)),
          );
        }

        // Aggregated topics
        const topicsMap = new Map<string, number>();
        db.questions.forEach((q) => {
          topicsMap.set(q.topic, (topicsMap.get(q.topic) ?? 0) + 1);
        });
        const topics = Array.from(topicsMap.entries()).map(([label, count]) => ({ label, count }));

        return {
          questions: questionResults,
          resources: resourceResults,
          mentors: mentorResults,
          topics,
        };
      })
    ).data,
};
