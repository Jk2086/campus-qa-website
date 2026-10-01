import { query } from '../config/db.js';

export function formatQuestion(row) {
  if (!row) return null;
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    description: row.description,
    subject: row.subject,
    topic: row.topic,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
    status: row.status,
    urgency: row.urgency || 'normal',
    upvotes: row.upvotes || 0,
    views: row.views || 0,
    answerCount: row.answer_count || 0,
    attachmentName: row.attachment_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const Question = {
  async findAll({ search, subject, tags, sort, status, authorId, limit } = {}) {
    let sql = 'SELECT * FROM questions WHERE 1=1';
    const params = [];

    if (authorId) {
      params.push(authorId);
      sql += ` AND author_id = $${params.length}`;
    }

    if (subject && subject !== 'all') {
      params.push(subject);
      sql += ` AND subject = $${params.length}`;
    }

    if (status && status !== 'all') {
      if (status === 'unanswered') {
        sql += ' AND answer_count = 0';
      } else {
        params.push(status);
        sql += ` AND status = $${params.length}`;
      }
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(description) LIKE $${params.length} OR LOWER(subject) LIKE $${params.length} OR LOWER(topic) LIKE $${params.length})`;
    }

    if (sort === 'popular') {
      sql += ' ORDER BY (upvotes * 2 + answer_count * 5 + views / 50) DESC, created_at DESC';
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    if (limit) {
      params.push(parseInt(limit, 10));
      sql += ` LIMIT $${params.length}`;
    }

    const { rows } = await query(sql, params);
    let results = rows.map(formatQuestion);

    // Filter by tags in memory if array of tags is requested
    if (tags && tags.length > 0) {
      const targetTags = (Array.isArray(tags) ? tags : [tags]).map((t) => t.toLowerCase());
      results = results.filter((q) =>
        targetTags.every((t) => q.tags.map((x) => x.toLowerCase()).includes(t))
      );
    }

    return results;
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM questions WHERE id = $1', [id]);
    return rows.length ? formatQuestion(rows[0]) : null;
  },

  async create({ id, authorId, title, description, subject, topic, tags = [], attachmentName, urgency = 'normal' }) {
    const { rows } = await query(
      `INSERT INTO questions (id, author_id, title, description, subject, topic, tags, attachment_name, status, urgency, upvotes, views, answer_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', $9, 0, 1, 0)
       RETURNING *`,
      [
        id,
        authorId,
        title,
        description,
        subject,
        topic || tags[0] || subject,
        JSON.stringify(tags),
        attachmentName || null,
        urgency,
      ]
    );
    return formatQuestion(rows[0]);
  },

  async update(id, updates) {
    const q = await this.findById(id);
    if (!q) return null;

    const title = updates.title !== undefined ? updates.title : q.title;
    const description = updates.description !== undefined ? updates.description : q.description;
    const subject = updates.subject !== undefined ? updates.subject : q.subject;
    const topic = updates.topic !== undefined ? updates.topic : q.topic;
    const tags = updates.tags !== undefined ? JSON.stringify(updates.tags) : JSON.stringify(q.tags);
    const status = updates.status !== undefined ? updates.status : q.status;
    const urgency = updates.urgency !== undefined ? updates.urgency : q.urgency;

    const { rows } = await query(
      `UPDATE questions
       SET title = $1, description = $2, subject = $3, topic = $4, tags = $5, status = $6, urgency = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [title, description, subject, topic, tags, status, urgency, id]
    );
    return formatQuestion(rows[0]);
  },

  async delete(id) {
    await query('DELETE FROM questions WHERE id = $1', [id]);
    return true;
  },

  async incrementViews(id) {
    await query('UPDATE questions SET views = views + 1 WHERE id = $1', [id]);
  },

  async updateAnswerCount(id, delta) {
    await query('UPDATE questions SET answer_count = answer_count + $1 WHERE id = $2', [delta, id]);
  },

  async markUrgent(id) {
    const { rows } = await query(
      `UPDATE questions SET urgency = 'urgent', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows.length ? formatQuestion(rows[0]) : null;
  },

  async toggleSaved(userId, questionId) {
    const { rows } = await query(
      'SELECT id FROM saved_questions WHERE user_id = $1 AND question_id = $2',
      [userId, questionId]
    );

    if (rows.length > 0) {
      await query('DELETE FROM saved_questions WHERE user_id = $1 AND question_id = $2', [userId, questionId]);
      return false; // Removed
    } else {
      await query('INSERT INTO saved_questions (user_id, question_id) VALUES ($1, $2)', [userId, questionId]);
      return true; // Saved
    }
  },

  async isSaved(userId, questionId) {
    const { rows } = await query(
      'SELECT id FROM saved_questions WHERE user_id = $1 AND question_id = $2',
      [userId, questionId]
    );
    return rows.length > 0;
  },

  async getSaved(userId) {
    const { rows } = await query(
      `SELECT q.* FROM questions q
       JOIN saved_questions s ON q.id = s.question_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );
    return rows.map(formatQuestion);
  },

  async getPopularTopics() {
    // Returns popular topics aggregated from questions
    const { rows } = await query(`
      SELECT topic as label, COUNT(*)::int as count
      FROM questions
      WHERE topic IS NOT NULL AND topic != ''
      GROUP BY topic
      ORDER BY count DESC
      LIMIT 10
    `);

    if (rows.length >= 3) return rows;

    // Fallback default topics if DB has few
    return [
      { label: 'Data Structures', count: 128 },
      { label: 'Electrostatics', count: 96 },
      { label: 'Molecular Techniques', count: 84 },
      { label: 'Cell Division', count: 71 },
      { label: 'Linear Algebra', count: 66 },
      { label: 'Chemical Bonding', count: 59 },
      { label: 'Operating Systems', count: 52 },
      { label: 'Thermodynamics', count: 47 },
    ];
  },

  async getSimilar({ title, questionId, subject }) {
    const all = await this.findAll();
    const base = questionId ? all.find((q) => q.id === questionId) : undefined;
    const words = (title ?? base?.title ?? '')
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);

    return all
      .filter((q) => q.id !== questionId)
      .map((q) => {
        const text = `${q.title} ${q.tags.join(' ')}`.toLowerCase();
        let s = words.filter((w) => text.includes(w)).length;
        if (base && q.subject === base.subject) s += 1;
        if (subject && q.subject === subject) s += 1;
        return { q, s };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 4)
      .map((x) => x.q);
  },

  format: formatQuestion,
};
