import { request } from "./client";
import { db, findUser, uid } from "./store";
import type { Answer, ResponseType } from "./types";

export const answers = {
  /** GET /questions/:id/answers */
  getAnswers: async (questionId: string) =>
    (
      await request<Answer[]>(`/questions/${questionId}/answers`, {}, () =>
        db.answers
          .filter((a) => a.questionId === questionId)
          .sort((a, b) => {
            // Faculty verified first, then accepted, then by upvotes
            const scoreA = (a.isFacultyVerified ? 100 : 0) + (a.isAccepted ? 50 : 0) + a.upvotes;
            const scoreB = (b.isFacultyVerified ? 100 : 0) + (b.isAccepted ? 50 : 0) + b.upvotes;
            return scoreB - scoreA;
          }),
      )
    ).data,

  /** POST /questions/:id/answers */
  createAnswer: async (payload: { questionId: string; authorId: string; content: string }) =>
    (
      await request<Answer>(`/questions/${payload.questionId}/answers`, { method: "POST", body: payload }, () => {
        const author = findUser(payload.authorId);
        let answerType: ResponseType = "peer";
        if (author?.role === "faculty") {
          answerType = "faculty_verified";
        }

        const answer: Answer = {
          id: uid("a"),
          questionId: payload.questionId,
          authorId: payload.authorId,
          content: payload.content,
          answerType,
          isAccepted: false,
          isFacultyVerified: author?.role === "faculty",
          verifiedBy: author?.role === "faculty" ? author.id : undefined,
          verifiedByName: author?.role === "faculty" ? author.name : undefined,
          verifiedAt: author?.role === "faculty" ? new Date().toISOString() : undefined,
          upvotes: 0,
          downvotes: 0,
          createdAt: new Date().toISOString(),
          replies: [],
        };

        db.answers.push(answer);
        const q = db.questions.find((item) => item.id === payload.questionId);
        if (q) q.answerCount += 1;

        if (q && author) {
          db.notifications.unshift({
            id: uid("n"),
            userId: q.authorId,
            type: author.role === "faculty" ? "faculty_verification" : author.role === "mentor" ? "mentor_request" : "answer",
            message: `${author.name} (${author.role === "faculty" ? "Faculty" : author.role === "mentor" ? "Peer Mentor" : "Student"}) answered "${q.title}".`,
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
          throw new Error("Only the question author can accept an answer.");

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
          message: `Your answer on "${question.title}" was marked as Accepted Solution! (+15 reputation) ✓`,
          questionId: question.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
        return accepted;
      })
    ).data,

  /** POST /answers/:id/verify — faculty or admin only */
  verifyAnswer: async (payload: { answerId: string; verifierId: string }) =>
    (
      await request<Answer>(`/answers/${payload.answerId}/verify`, { method: "POST", body: payload }, () => {
        const answer = db.answers.find((a) => a.id === payload.answerId);
        if (!answer) throw new Error("Answer not found");
        const verifier = findUser(payload.verifierId);
        if (!verifier || (verifier.role !== "faculty" && verifier.role !== "admin")) {
          throw new Error("Only faculty or administrators can verify answers.");
        }

        answer.isFacultyVerified = true;
        answer.verifiedBy = verifier.id;
        answer.verifiedByName = verifier.name;
        answer.verifiedAt = new Date().toISOString();
        answer.answerType = "faculty_verified";

        const author = findUser(answer.authorId);
        if (author) author.reputation += 25;

        const q = db.questions.find((item) => item.id === answer.questionId);
        db.notifications.unshift({
          id: uid("n"),
          userId: answer.authorId,
          type: "faculty_verification",
          message: `${verifier.name} verified your answer on "${q?.title ?? "a question"}". It is now added to the verified campus knowledge base! (+25 reputation) 🎓`,
          questionId: answer.questionId,
          read: false,
          createdAt: new Date().toISOString(),
        });

        return answer;
      })
    ).data,

  /** POST /answers/:id/unverify */
  unverifyAnswer: async (payload: { answerId: string; verifierId: string }) =>
    (
      await request<Answer>(`/answers/${payload.answerId}/unverify`, { method: "POST", body: payload }, () => {
        const answer = db.answers.find((a) => a.id === payload.answerId);
        if (!answer) throw new Error("Answer not found");
        answer.isFacultyVerified = false;
        answer.verifiedBy = undefined;
        answer.verifiedByName = undefined;
        answer.verifiedAt = undefined;
        answer.answerType = "peer";
        return answer;
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
