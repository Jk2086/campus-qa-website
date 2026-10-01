import { MentorProfile } from '../models/MentorProfile.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';

export const routingService = {
  /**
   * Find recommended peer mentors and faculty for a given question/topic
   */
  async findMentorsForQuestion({ subject, topic, tags = [] }) {
    const allMentors = await MentorProfile.findAll();
    const tagSet = new Set(tags.map((t) => t.toLowerCase()));

    const scored = allMentors.map((mentor) => {
      let score = 0;

      // Match subject
      if (mentor.expertise.includes(subject)) {
        score += 10;
      }

      // Match bio or department with topic/tags
      const bioLower = (mentor.bio || '').toLowerCase();
      if (topic && bioLower.includes(topic.toLowerCase())) {
        score += 5;
      }

      tagSet.forEach((tag) => {
        if (bioLower.includes(tag)) score += 3;
      });

      // Bonus for reputation & helpful answers
      score += Math.min(10, Math.floor((mentor.helpfulAnswers || 0) / 20));

      return { mentor, score };
    });

    // Sort by relevance score
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((s) => s.mentor);
  },

  /**
   * Dispatches notifications to appropriate mentors for a newly submitted question
   */
  async routeQuestion(question, isUrgent = false) {
    const matchedMentors = await this.findMentorsForQuestion({
      subject: question.subject,
      topic: question.topic,
      tags: question.tags,
    });

    const notificationsSent = [];
    const urgencyPrefix = isUrgent ? '[URGENT] ' : '';

    for (const mentor of matchedMentors) {
      if (mentor.userId === question.authorId) continue;

      const notifId = `n_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const notif = await Notification.create({
        id: notifId,
        userId: mentor.userId,
        type: isUrgent ? 'urgent' : 'mentor',
        message: `${urgencyPrefix}New question in your expertise (${question.subject}): "${question.title.substring(0, 50)}..."`,
        questionId: question.id,
      });
      notificationsSent.push(notif);
    }

    return {
      matchedMentors,
      notificationsSent,
    };
  },
};
