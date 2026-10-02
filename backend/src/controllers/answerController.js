import { Answer } from '../models/Answer.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { Report } from '../models/Report.js';
import { Vote } from '../models/Vote.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const answerController = {
  /**
   * GET /questions/:id/answers or /api/questions/:id/answers
   */
  async getAnswers(req, res) {
    try {
      const { id: questionId } = req.params;
      const list = await Answer.findByQuestionId(questionId);
      return sendSuccess(res, list);
    } catch (err) {
      return sendError(res, 'Failed to fetch answers', 500, err.message);
    }
  },

  /**
   * POST /questions/:id/answers or /api/questions/:id/answers
   */
  async createAnswer(req, res) {
    try {
      const { id: questionId } = req.params;
      const { content, authorId, answerType = 'PEER_ANSWER' } = req.body;
      const effectiveAuthorId = req.user ? req.user.id : authorId;

      if (!effectiveAuthorId) {
        return sendError(res, 'Author ID is required', 400);
      }

      const question = await Question.findById(questionId);
      if (!question) {
        return sendError(res, 'Question not found', 404);
      }

      const author = await User.findById(effectiveAuthorId);
      const isFaculty = author?.role === 'faculty';
      const effectiveType = isFaculty ? 'FACULTY_ANSWER' : answerType;

      const answerId = `a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const created = await Answer.create({
        id: answerId,
        questionId,
        authorId: effectiveAuthorId,
        content,
        answerType: effectiveType,
      });

      // Update question answer count
      await Question.updateAnswerCount(questionId, 1);

      // Notify question owner
      if (question.authorId !== effectiveAuthorId) {
        const notifId = `n_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await Notification.create({
          id: notifId,
          userId: question.authorId,
          type: author?.role === 'student' ? 'answer' : 'mentor',
          message: `${author?.name || 'A user'} answered "${question.title}".`,
          questionId,
        });
      }

      return sendSuccess(res, created, 'Answer posted successfully', 201);
    } catch (err) {
      return sendError(res, 'Failed to create answer', 500, err.message);
    }
  },

  /**
   * PUT /answers/:id or /api/answers/:id
   */
  async updateAnswer(req, res) {
    try {
      const { id } = req.params;
      const existing = await Answer.findById(id);

      if (!existing) {
        return sendError(res, 'Answer not found', 404);
      }

      if (req.user && req.user.role !== 'admin' && req.user.id !== existing.authorId) {
        return sendError(res, 'You can only edit your own answers.', 403);
      }

      const updated = await Answer.update(id, req.body);
      return sendSuccess(res, updated, 'Answer updated successfully');
    } catch (err) {
      return sendError(res, 'Failed to update answer', 500, err.message);
    }
  },

  /**
   * DELETE /answers/:id or /api/answers/:id
   */
  async deleteAnswer(req, res) {
    try {
      const { id } = req.params;
      const existing = await Answer.findById(id);

      if (!existing) {
        return sendError(res, 'Answer not found', 404);
      }

      if (req.user && req.user.role !== 'admin' && req.user.id !== existing.authorId) {
        return sendError(res, 'You can only delete your own answers.', 403);
      }

      await Answer.delete(id);
      await Question.updateAnswerCount(existing.questionId, -1);

      return sendSuccess(res, { deleted: true }, 'Answer deleted successfully');
    } catch (err) {
      return sendError(res, 'Failed to delete answer', 500, err.message);
    }
  },

  /**
   * POST /answers/:id/accept or /api/answers/:id/accept
   */
  async acceptAnswer(req, res) {
    try {
      const { id: answerId } = req.params;
      const { questionId, requesterId } = req.body;
      const effectiveRequesterId = req.user ? req.user.id : requesterId;

      const answer = await Answer.findById(answerId);
      if (!answer) {
        return sendError(res, 'Answer not found', 404);
      }

      const targetQuestionId = questionId || answer.questionId;
      const question = await Question.findById(targetQuestionId);
      if (!question) {
        return sendError(res, 'Question not found', 404);
      }

      // Verify question owner
      if (effectiveRequesterId && question.authorId !== effectiveRequesterId && req.user?.role !== 'admin') {
        return sendError(res, 'Only the question author can accept an answer.', 403);
      }

      const accepted = await Answer.accept(answerId, targetQuestionId);

      // Award +15 reputation to answer author
      await User.addReputation(answer.authorId, 15);

      // Notify answer author
      const notifId = `n_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await Notification.create({
        id: notifId,
        userId: answer.authorId,
        type: 'accepted',
        message: `Your answer on "${question.title}" was accepted. +15 reputation.`,
        questionId: question.id,
      });

      return sendSuccess(res, accepted, 'Answer accepted. Author earned +15 reputation.');
    } catch (err) {
      return sendError(res, 'Failed to accept answer', 500, err.message);
    }
  },

  /**
   * POST /answers/:id/verify or /api/answers/:id/verify
   * Only faculty and admin can verify answers
   */
  async verifyAnswer(req, res) {
    try {
      const { id } = req.params;
      const facultyId = req.user ? req.user.id : (req.body.facultyId || 'u2');

      if (req.user && !['faculty', 'admin'].includes(req.user.role)) {
        return sendError(res, 'Only faculty and administrators can verify answers.', 403);
      }

      const verified = await Answer.verify(id, facultyId);
      if (!verified) {
        return sendError(res, 'Answer not found', 404);
      }

      // Award +25 reputation to author for faculty verification
      await User.addReputation(verified.authorId, 25);

      return sendSuccess(res, verified, 'Answer verified by faculty.');
    } catch (err) {
      return sendError(res, 'Failed to verify answer', 500, err.message);
    }
  },

  /**
   * POST /answers/:id/unverify or /api/answers/:id/unverify
   * Only faculty and admin can unverify answers
   */
  async unverifyAnswer(req, res) {
    try {
      const { id } = req.params;
      const verifierId = req.user ? req.user.id : (req.body.verifierId || 'u2');

      if (req.user && !['faculty', 'admin'].includes(req.user.role)) {
        return sendError(res, 'Only faculty and administrators can unverify answers.', 403);
      }

      const unverified = await Answer.unverify(id);
      if (!unverified) {
        return sendError(res, 'Answer not found', 404);
      }

      return sendSuccess(res, unverified, 'Answer verification removed.');
    } catch (err) {
      return sendError(res, 'Failed to unverify answer', 500, err.message);
    }
  },

  /**
   * POST /answers/:id/replies or /api/answers/:id/replies
   */
  async replyToAnswer(req, res) {
    try {
      const { id: answerId } = req.params;
      const { content, authorId } = req.body;
      const effectiveAuthorId = req.user ? req.user.id : authorId;

      if (!effectiveAuthorId || !content) {
        return sendError(res, 'Content and authorId are required', 400);
      }

      const replyId = `r_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await Answer.addReply({
        id: replyId,
        answerId,
        authorId: effectiveAuthorId,
        content,
      });

      const updatedAnswer = await Answer.findById(answerId);
      return sendSuccess(res, updatedAnswer, 'Reply added successfully');
    } catch (err) {
      return sendError(res, 'Failed to add reply', 500, err.message);
    }
  },

  /**
   * POST /answers/:id/vote or /api/answers/:id/vote
   */
  async voteAnswer(req, res) {
    try {
      const { id } = req.params;
      const { voteType = 1 } = req.body;
      const userId = req.user ? req.user.id : (req.body.userId || 'u1');

      const result = await Vote.vote({
        userId,
        contentId: id,
        contentType: 'answer',
        voteType,
      });

      return sendSuccess(res, result);
    } catch (err) {
      return sendError(res, 'Vote failed', 500, err.message);
    }
  },

  /**
   * POST /answers/:id/report or /api/answers/:id/report
   */
  async reportAnswer(req, res) {
    try {
      const { id } = req.params;
      const { reason = 'Flagged answer', excerpt = '' } = req.body;
      const reporterId = req.user ? req.user.id : (req.body.reporterId || 'u1');

      const answer = await Answer.findById(id);
      if (!answer) {
        return sendError(res, 'Answer not found', 404);
      }

      const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const report = await Report.create({
        id: reportId,
        reporterId,
        contentId: id,
        contentType: 'answer',
        excerpt: excerpt || answer.content.substring(0, 80),
        reason,
      });

      return sendSuccess(res, report, 'Answer reported for moderator review.');
    } catch (err) {
      return sendError(res, 'Failed to report answer', 500, err.message);
    }
  },
};
