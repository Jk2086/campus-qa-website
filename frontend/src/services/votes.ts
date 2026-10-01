import { request } from "./client";
import { db } from "./store";

export const votes = {
  /** POST /votes — duplicate votes are rejected server-side later. */
  vote: async (payload: { contentId: string; contentType: "question" | "answer"; voteType: 1 | -1 }) =>
    (
      await request<{ contentId: string; upvotes: number; myVote: 1 | -1 | undefined }>(
        "/votes",
        { method: "POST", body: payload },
        () => {
          const previous = db.votes[payload.contentId];
          const target =
            payload.contentType === "question"
              ? db.questions.find((q) => q.id === payload.contentId)
              : db.answers.find((a) => a.id === payload.contentId);
          if (!target) throw new Error("Content not found");

          if (previous === payload.voteType) {
            target.upvotes -= payload.voteType;
            db.votes[payload.contentId] = undefined;
          } else {
            target.upvotes += previous ? payload.voteType * 2 : payload.voteType;
            db.votes[payload.contentId] = payload.voteType;
          }
          return { contentId: payload.contentId, upvotes: target.upvotes, myVote: db.votes[payload.contentId] };
        },
      )
    ).data,

  myVote: (contentId: string) => db.votes[contentId],
};
