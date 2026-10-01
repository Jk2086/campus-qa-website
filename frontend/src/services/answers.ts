import { request } from "./client";
import { db, findUser, uid } from "./store";
import type { Answer } from "./types";

export const answers = {
  /** GET /questions/:id/answers */
  getAnswers: async (questionId: string) =>
    (
      await request<Answer[]>(`/questions/${questionId}/answers`, {}, () =>
        db.answers
          .filter((a) => a.questionId === questionId)
          .sort((a, b) => Number(b.isAccepted) - Number(a.isAccepted) || b.upvotes - a.upvotes),
      )
    ).data,

  /** POST /questions/:id/answers */
  createAnswer: async (payload: { questionId: string; authorId: string; content: string }) =>
    (
      await request<Answer>(`/questions/${payload.questionId}/answers`, { method: "POST", body: payload }, () => {
        const answer: Answer = {
          id: uid("a"),
          questionId: payload.questionId,
          authorId: payload.authorId,
          content: payload.content,
          isAccepted: false,
          upvotes: 0,
          createdAt: new Date().toISOString(),
          replies: [],
        };
        db.answers.push(answer);
        const q = db.questions.find((item) => item.id === payload.questionId);
        if (q) q.answerCount += 1;
        const author = findUser(payload.authorId);
        if (q && author) {
          db.notifications.unshift({
            id: uid("n"),
            userId: q.authorId,
            type: author.role === "student" ? "answer" : "mentor",
            message: `${author.name} answered "${q.title}".`,
            questionId: q.id,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
        return answer;
      })
    ).data,

  /** POST /answers/:id/accept — question owner only */
  acceptAnswer: async (payload: { answerId: string; questionId: string; requesterId: string }) =>
    (
      await request<Answer>(`/answers/${payload.answerId}/accept`, { method: "POST", body: payload }, () => {
        const question = db.questions.find((q) => q.id === payload.questionId);
        if (!question) throw new Error("Question not found");
        if (question.authorId !== payload.requesterId)
          throw new Error("Only the question owner can accept an answer.");
        db.answers
          .filter((a) => a.questionId === payload.questionId)
          .forEach((a) => {
            a.isAccepted = a.id === payload.answerId;
          });
        question.status = "solved";
        const accepted = db.answers.find((a) => a.id === payload.answerId)!;
        const author = findUser(accepted.authorId);
        if (author) author.reputation += 15;
        db.notifications.unshift({
          id: uid("n"),
          userId: accepted.authorId,
          type: "accepted",
          message: `Your answer on "${question.title}" was accepted. +15 reputation.`,
          questionId: question.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
        return accepted;
      })
    ).data,

  /** POST /answers/:id/replies */
  replyToAnswer: async (payload: { answerId: string; authorId: string; content: string }) => {
    const answer = db.answers.find((a) => a.id === payload.answerId);
    if (!answer) throw new Error("Answer not found");
    answer.replies.push({
      id: uid("r"),
      authorId: payload.authorId,
      content: payload.content,
      createdAt: new Date().toISOString(),
    });
    return answer;
  },
};
