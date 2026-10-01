/**
 * AI assistance. These call the future backend AI endpoints
 * (POST /ai/hint, /ai/similar-questions, /ai/classify, /ai/moderate).
 * No model keys are ever present in the browser — the backend owns them.
 */
import { request } from "./client";
import { db } from "./store";
import type { Question } from "./types";

const hintFor = (q: Question) =>
  `Start from the definition that the question depends on, then work one step at a time.\n\n• Core idea: ${q.title.replace(/\?$/, "")} is usually best approached by identifying what stays constant and what changes.\n• Try this: write down the given quantities for ${q.subject.toLowerCase()}, state the governing rule in your own words, then apply it to the smallest possible case before generalising.\n• Check yourself: if your result does not reduce to the trivial case, the error is in the setup, not the arithmetic.`;

const explainFor = (q: Question) =>
  `Concept walkthrough — ${q.topic} (${q.subject})\n\n1. What it is: the topic describes the mechanism behind "${q.title.replace(/\?$/, "")}".\n2. Why it matters: it connects directly to the assessment outcomes in this course unit.\n3. How to use it: identify the inputs, apply the standard relation, then interpret the result physically rather than just numerically.\n4. Common mistake: students jump to the formula before confirming the assumptions hold.`;

export const ai = {
  /** POST /ai/hint */
  getHint: async (questionId: string) =>
    (
      await request<{ hint: string }>("/ai/hint", { method: "POST", body: { questionId } }, () => {
        const q = db.questions.find((item) => item.id === questionId);
        return { hint: q ? hintFor(q) : "No hint available for this question yet." };
      })
    ).data,

  /** POST /ai/explain */
  explainConcept: async (questionId: string) =>
    (
      await request<{ explanation: string }>("/ai/explain", { method: "POST", body: { questionId } }, () => {
        const q = db.questions.find((item) => item.id === questionId);
        return { explanation: q ? explainFor(q) : "No explanation available yet." };
      })
    ).data,

  /** POST /ai/similar-questions */
  relatedQuestions: async (questionId: string) =>
    (
      await request<Question[]>("/ai/similar-questions", { method: "POST", body: { questionId } }, () => {
        const q = db.questions.find((item) => item.id === questionId);
        return db.questions.filter((item) => item.id !== questionId && item.subject === q?.subject).slice(0, 3);
      })
    ).data,

  DISCLAIMER:
    "AI-generated assistance may contain errors. Verify important academic information.",
};
