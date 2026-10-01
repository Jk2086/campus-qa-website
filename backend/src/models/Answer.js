import { query } from '../config/db.js';

export async function formatAnswer(row) {
  if (!row) return null;

  // Fetch replies for this answer
  const { rows: replies } = await query(
    'SELECT id, author_id as "authorId", content, created_at as "createdAt" FROM answer_replies WHERE answer_id = $1 ORDER BY created_at ASC',
    [row.id]
  );

  return {
    id: row.id,
    questionId: row.question_id,
    authorId: row.author_id,
    content: row.content,
    isAccepted: Boolean(row.is_accepted),
    isVerified: Boolean(row.is_verified),
    answerType: row.answer_type || 'PEER_ANSWER',
    upvotes: row.upvotes || 0,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    replies: replies || [],
  };
}

export const Answer = {
  async findByQuestionId(questionId) {
    const { rows } = await query(
      `SELECT * FROM answers
       WHERE question_id = $1
       ORDER BY is_accepted DESC, upvotes DESC, created_at DESC`,
      [questionId]
    );

    return Promise.all(rows.map(formatAnswer));
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM answers WHERE id = $1', [id]);
    return rows.length ? formatAnswer(rows[0]) : null;
  },

  async create({ id, questionId, authorId, content, answerType = 'PEER_ANSWER' }) {
    const { rows } = await query(
      `INSERT INTO answers (id, question_id, author_id, content, is_accepted, is_verified, answer_type, upvotes)
       VALUES ($1, $2, $3, $4, FALSE, FALSE, $5, 0)
       RETURNING *`,
      [id, questionId, authorId, content, answerType]
    );
    return formatAnswer(rows[0]);
  },

  async update(id, updates) {
    const a = await this.findById(id);
    if (!a) return null;

    const content = updates.content !== undefined ? updates.content : a.content;
    const { rows } = await query(
      `UPDATE answers SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [content, id]
    );
    return formatAnswer(rows[0]);
  },

  async delete(id) {
    await query('DELETE FROM answers WHERE id = $1', [id]);
    return true;
  },

  async accept(answerId, questionId) {
    // Unaccept all other answers for this question
    await query(
      'UPDATE answers SET is_accepted = FALSE WHERE question_id = $1',
      [questionId]
    );

    // Accept this one
    const { rows } = await query(
      `UPDATE answers
       SET is_accepted = TRUE, answer_type = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [answerId]
    );

    // Update question status to solved
    await query(
      `UPDATE questions SET status = 'solved', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [questionId]
    );

    return formatAnswer(rows[0]);
  },

  async verify(answerId, facultyId) {
    const { rows } = await query(
      `UPDATE answers
       SET is_verified = TRUE, verified_by = $1, verified_at = CURRENT_TIMESTAMP, answer_type = 'FACULTY_VERIFIED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [facultyId, answerId]
    );
    return formatAnswer(rows[0]);
  },

  async addReply({ id, answerId, authorId, content }) {
    const { rows } = await query(
      `INSERT INTO answer_replies (id, answer_id, author_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, author_id as "authorId", content, created_at as "createdAt"`,
      [id, answerId, authorId, content]
    );
    return rows[0];
  },

  async incrementUpvotes(id, delta) {
    const { rows } = await query(
      'UPDATE answers SET upvotes = upvotes + $1 WHERE id = $2 RETURNING *',
      [delta, id]
    );
    return formatAnswer(rows[0]);
  },

  format: formatAnswer,
};
