import { query } from '../config/db.js';

export function formatNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    message: row.message,
    questionId: row.question_id || undefined,
    read: Boolean(row.read),
    createdAt: row.created_at,
  };
}

export const Notification = {
  async findByUserId(userId) {
    // If querying for demo user or current user, include notifications targeted to them or broadcast
    const { rows } = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1 OR user_id = 'u1'
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows.map(formatNotification);
  },

  async create({ id, userId, type, message, questionId }) {
    const { rows } = await query(
      `INSERT INTO notifications (id, user_id, type, message, question_id, read)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING *`,
      [id, userId, type, message, questionId || null]
    );
    return formatNotification(rows[0]);
  },

  async markRead(id) {
    const { rows } = await query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    return rows.length ? formatNotification(rows[0]) : null;
  },

  async markAllRead(userId) {
    await query(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1 OR user_id = \'u1\'',
      [userId]
    );
    return true;
  },

  format: formatNotification,
};
