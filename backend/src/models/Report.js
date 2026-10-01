import { query } from '../config/db.js';

export function formatReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    reporterId: row.reporter_id,
    contentId: row.content_id,
    contentType: row.content_type,
    excerpt: row.excerpt,
    reason: row.reason,
    status: row.status,
    reviewedBy: row.reviewed_by,
    actionTaken: row.action_taken,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const Report = {
  async findAll() {
    const { rows } = await query('SELECT * FROM reports ORDER BY created_at DESC');
    return rows.map(formatReport);
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM reports WHERE id = $1', [id]);
    return rows.length ? formatReport(rows[0]) : null;
  },

  async create({ id, reporterId, contentId, contentType, excerpt, reason }) {
    const { rows } = await query(
      `INSERT INTO reports (id, reporter_id, content_id, content_type, excerpt, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [id, reporterId, contentId, contentType, excerpt, reason]
    );
    return formatReport(rows[0]);
  },

  async updateStatus(id, status, reviewerId = null, actionTaken = '') {
    const { rows } = await query(
      `UPDATE reports
       SET status = $1, reviewed_by = $2, action_taken = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, reviewerId, actionTaken, id]
    );

    if (!rows.length) return null;
    const report = formatReport(rows[0]);

    // Record moderation log
    await query(
      `INSERT INTO moderation_logs (moderator_id, report_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [reviewerId, id, status, `Report marked as ${status}. ${actionTaken}`]
    );

    // If status is 'removed', remove the target question or answer
    if (status === 'removed') {
      if (report.contentType === 'question') {
        await query('DELETE FROM questions WHERE id = $1', [report.contentId]);
      } else if (report.contentType === 'answer') {
        await query('DELETE FROM answers WHERE id = $1', [report.contentId]);
      }
    }

    return report;
  },

  async getLogs() {
    const { rows } = await query('SELECT * FROM moderation_logs ORDER BY created_at DESC');
    return rows;
  },

  format: formatReport,
};
