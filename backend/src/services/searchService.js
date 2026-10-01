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
        questions: [],
        mentors: [],
        resources: [],
        knowledge: [],
      };
    }

    const clean = term.trim();

    const [questions, mentors, resources, knowledge] = await Promise.all([
      Question.findAll({ search: clean, limit: 6 }),
      MentorProfile.findAll({ search: clean }),
      CampusResource.search(clean),
      KnowledgeBase.search(clean),
    ]);

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
      },
    };
  },
};
