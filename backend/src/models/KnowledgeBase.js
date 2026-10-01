import { query } from '../config/db.js';

export function formatKnowledge(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    subject: row.subject,
    topic: row.topic,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
    sourceQuestionId: row.source_question_id,
    sourceAnswerId: row.source_answer_id,
    verifiedBy: row.verified_by,
    status: row.status || 'VERIFIED_CAMPUS_ANSWER',
    createdAt: row.created_at,
  };
}

export const KnowledgeBase = {
  async findAll({ subject, limit = 20 } = {}) {
    let sql = 'SELECT * FROM knowledge_base WHERE 1=1';
    const params = [];

    if (subject && subject !== 'all') {
      params.push(subject);
      sql += ` AND subject = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    if (limit) {
      params.push(limit);
      sql += ` LIMIT $${params.length}`;
    }

    const { rows } = await query(sql, params);
    return rows.map(formatKnowledge);
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM knowledge_base WHERE id = $1', [id]);
    return rows.length ? formatKnowledge(rows[0]) : null;
  },

  async search(searchTerm, subject) {
    const term = `%${searchTerm.toLowerCase()}%`;
    let sql = `
      SELECT * FROM knowledge_base
      WHERE (LOWER(title) LIKE $1 OR LOWER(content) LIKE $1 OR LOWER(topic) LIKE $1)
    `;
    const params = [term];

    if (subject && subject !== 'all') {
      params.push(subject);
      sql += ` AND subject = $${params.length}`;
    }

    sql += ' LIMIT 5';
    const { rows } = await query(sql, params);
    return rows.map(formatKnowledge);
  },

  async create({ id, title, content, subject, topic, tags = [], sourceQuestionId, sourceAnswerId, verifiedBy }) {
    const { rows } = await query(
      `INSERT INTO knowledge_base (id, title, content, subject, topic, tags, source_question_id, source_answer_id, verified_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'VERIFIED_CAMPUS_ANSWER')
       RETURNING *`,
      [id, title, content, subject, topic, JSON.stringify(tags), sourceQuestionId || null, sourceAnswerId || null, verifiedBy || null]
    );
    return formatKnowledge(rows[0]);
  },

  format: formatKnowledge,
};
