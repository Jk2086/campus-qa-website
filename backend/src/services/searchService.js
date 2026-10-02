import { Question } from '../models/Question.js';
import { MentorProfile } from '../models/MentorProfile.js';
import { CampusResource } from '../models/CampusResource.js';
import { KnowledgeBase } from '../models/KnowledgeBase.js';
import { query } from '../config/db.js';

export const searchService = {
  /**
   * Unified search across campus knowledge, questions, resources, and mentors
   */
  async searchAll(term) {
    if (!term || term.trim() === '') {
      return {
        query: '',
        counts: { questions: 0, mentors: 0, resources: 0, knowledge: 0 },
        results: { questions: [], mentors: [], resources: [], knowledge: [], topics: [] },
        questions: [],
        mentors: [],
        resources: [],
        topics: [],
        knowledge: [],
      };
    }

    const clean = term.trim();

    const [questions, mentors, resources, knowledge, topicRes] = await Promise.all([
      Question.findAll({ search: clean, limit: 10 }),
      MentorProfile.findAll({ search: clean }),
      CampusResource.search(clean),
      KnowledgeBase.search(clean),
      query('SELECT topic as label, COUNT(*)::int as count FROM questions GROUP BY topic ORDER BY count DESC LIMIT 10'),
    ]);

    const topics = topicRes.rows || [];

    return {
      query: clean,
      counts: {
        questions: questions.length,
        mentors: mentors.length,
        resources: resources.length,
        knowledge: knowledge.length,
      },
      results: {
        questions,
        mentors,
        resources,
        knowledge,
        topics,
      },
      questions,
      mentors,
      resources,
      topics,
      knowledge,
    };
  },
};
