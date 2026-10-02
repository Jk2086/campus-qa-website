import { request } from "./client";
import { db, findUser, uid } from "./store";
import type { Question, QuestionHelper, QuestionQuery, Subject } from "./types";

const score = (q: Question) => q.upvotes * 2 + q.answerCount * 5 + q.views / 50 + (q.isUrgent ? 100 : 0);

function filter(query: QuestionQuery): Question[] {
  let items = [...db.questions];
  if (query.authorId) items = items.filter((q) => q.authorId === query.authorId);
  if (query.subject && query.subject !== "all") items = items.filter((q) => q.subject === query.subject);
  if (query.isUrgent !== undefined) items = items.filter((q) => Boolean(q.isUrgent) === query.isUrgent);
  if (query.tags?.length)
    items = items.filter((q) => query.tags!.every((t) => q.tags.map((x) => x.toLowerCase()).includes(t.toLowerCase())));
  if (query.status === "solved") items = items.filter((q) => q.status === "solved");
  if (query.status === "open") items = items.filter((q) => q.status === "open");
  if (query.status === "unanswered") items = items.filter((q) => q.answerCount === 0);
  if (query.verifiedOnly) {
    items = items.filter(
      (q) =>
        q.instantAssistance?.responseType === "verified_campus" ||
        q.instantAssistance?.responseType === "faculty_verified" ||
        db.answers.some((a) => a.questionId === q.id && a.isFacultyVerified),
    );
  }
  if (query.search) {
    const s = query.search.toLowerCase();
    items = items.filter(
      (q) =>
        q.title.toLowerCase().includes(s) ||
        q.description.toLowerCase().includes(s) ||
        q.tags.some((t) => t.toLowerCase().includes(s)) ||
        q.subject.toLowerCase().includes(s),
    );
  }
  items.sort((a, b) =>
    query.sort === "popular" ? score(b) - score(a) : +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  return query.limit ? items.slice(0, query.limit) : items;
}

export const questions = {
  /** GET /questions */
  getQuestions: async (query: QuestionQuery = {}) =>
    (await request<Question[]>("/questions", { query: query as Record<string, unknown> }, () => filter(query))).data,

  /** GET /questions/:id */
  getQuestion: async (id: string) =>
    (
      await request<Question>(`/questions/${id}`, {}, () => {
        const q = db.questions.find((item) => item.id === id);
        if (!q) throw new Error("Question not found");
        return q;
      })
    ).data,

  /** GET /questions/search */
  searchQuestions: async (term: string, query: QuestionQuery = {}) =>
    (
      await request<Question[]>("/questions/search", { query: { q: term } }, () =>
        filter({ ...query, search: term }),
      )
    ).data,

  /** GET /questions/similar */
  getSimilarQuestions: async (input: { title?: string; questionId?: string; subject?: Subject }) =>
    (
      await request<Question[]>("/questions/similar", { query: input as Record<string, unknown> }, () => {
        const base = input.questionId ? db.questions.find((q) => q.id === input.questionId) : undefined;
        const words = (input.title ?? base?.title ?? "")
          .toLowerCase()
          .split(/\W+/)
          .filter((w) => w.length > 3);
        return db.questions
          .filter((q) => q.id !== input.questionId)
          .map((q) => {
            const text = `${q.title} ${q.tags.join(" ")}`.toLowerCase();
            let s = words.filter((w) => text.includes(w)).length;
            if (base && q.subject === base.subject) s += 1;
            if (input.subject && q.subject === input.subject) s += 1;
            return { q, s };
          })
          .filter((x) => x.s > 0)
          .sort((a, b) => b.s - a.s)
          .slice(0, 4)
          .map((x) => x.q);
      })
    ).data,

  /** POST /questions */
  createQuestion: async (payload: {
    title: string;
    description: string;
    subject: Subject;
    topic?: string;
    tags: string[];
    isUrgent?: boolean;
    attachmentName?: string;
    authorId: string;
    requestInstantAI?: boolean;
    requestParallelHelpers?: boolean;
  }) =>
    (
      await request<Question>("/questions", { method: "POST", body: payload }, () => {
        const helpers: QuestionHelper[] = [];
        const relevantMentors = db.mentors.filter((m) => m.expertise.includes(payload.subject));
        relevantMentors.slice(0, 3).forEach((m) => {
          const user = findUser(m.userId);
          if (user) {
            helpers.push({
              id: user.id,
              name: user.name,
              role: user.role,
              department: user.department,
              status: "notified",
            });
          }
        });

        const q: Question = {
          id: uid("q"),
          authorId: payload.authorId,
          title: payload.title,
          description: payload.description,
          subject: payload.subject,
          topic: payload.topic ?? payload.tags[0] ?? payload.subject,
          tags: payload.tags,
          status: "open",
          isUrgent: Boolean(payload.isUrgent),
          attachmentName: payload.attachmentName,
          upvotes: 0,
          views: 1,
          answerCount: 0,
          createdAt: new Date().toISOString(),
          notifiedHelpers: helpers,
          instantAssistance: {
            mode: "ai_suggested",
            title: payload.isUrgent ? "⚡ Immediate AI Diagnostic (Urgent Priority)" : "🤖 AI Suggested Answer",
            content: `Initial assistance on "${payload.title}":\n\n1. Break the problem into known baseline conditions.\n2. Review standard definitions for ${payload.subject}.\n3. Relevant peer mentors and faculty helpers have been notified in parallel to provide human-verified solutions.`,
            responseType: "ai_suggested",
            hints: [
              "Formulate test cases for boundary values.",
              "Consult corresponding lecture reference sheets in the library directory.",
            ],
          },
        };

        db.questions.unshift(q);

        // If marked urgent or helpers requested, post notifications to helpers
        if (payload.isUrgent) {
          helpers.forEach((h) => {
            db.notifications.unshift({
              id: uid("n"),
              userId: h.id,
              type: "urgent_question",
              message: `🚨 URGENT Question posted in ${payload.subject}: "${payload.title.slice(0, 50)}…"`,
              questionId: q.id,
              read: false,
              createdAt: new Date().toISOString(),
            });
          });
        }

        return q;
      })
    ).data,

  /** Local-only until the backend exists. */
  saveDraft: async (draft: { title: string; description: string }) => {
    db.drafts.unshift({ ...draft, id: uid("d"), savedAt: new Date().toISOString() });
    return db.drafts[0]!;
  },

  /** POST /questions/:id/save */
  toggleSaved: async (id: string) => {
    const idx = db.savedQuestionIds.indexOf(id);
    if (idx >= 0) db.savedQuestionIds.splice(idx, 1);
    else db.savedQuestionIds.push(id);
    return db.savedQuestionIds.includes(id);
  },

  /** GET /me/saved */
  getSaved: async () =>
    (await request<Question[]>("/me/saved", {}, () => db.questions.filter((q) => db.savedQuestionIds.includes(q.id)))).data,

  isSaved: (id: string) => db.savedQuestionIds.includes(id),

  /** GET /topics/popular */
  getPopularTopics: async () =>
    (
      await request<{ label: string; count: number }[]>("/topics/popular", {}, () => {
        const counts = new Map<string, number>();
        db.questions.forEach((q) => {
          counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
        });
        return Array.from(counts.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
      })
    ).data,
};
