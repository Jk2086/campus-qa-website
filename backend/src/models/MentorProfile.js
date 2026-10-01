import { query } from '../config/db.js';
import { formatUser } from './User.js';

export function formatMentor(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    expertise: typeof row.expertise === 'string' ? JSON.parse(row.expertise) : row.expertise || [],
    verified: Boolean(row.verified),
    helpfulAnswers: row.helpful_answers || 0,
    bio: row.bio || '',
    responseTime: row.response_time || 'Usually replies in a few hours',
    department: row.department,
    yearOrDesignation: row.year_or_designation,
    availability: row.availability,
    contactMethod: row.contact_method,
  };
}

export const MentorProfile = {
  async findAll({ subject, search } = {}) {
    let sql = `
      SELECT m.*, u.id as u_id, u.name as u_name, u.email as u_email, u.student_id as u_student_id,
             u.role as u_role, u.reputation as u_reputation, u.subjects as u_subjects,
             u.badges as u_badges, u.avatar_initials as u_avatar_initials, u.institution as u_institution,
             u.created_at as u_created_at
      FROM mentor_profiles m
      JOIN users u ON m.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(m.bio) LIKE $${params.length})`;
    }

    sql += ' ORDER BY u.reputation DESC';

    const { rows } = await query(sql, params);

    let list = rows.map((r) => {
      const mentor = formatMentor(r);
      const user = formatUser({
        id: r.u_id,
        name: r.u_name,
        email: r.u_email,
        student_id: r.u_student_id,
        role: r.u_role,
        reputation: r.u_reputation,
        subjects: r.u_subjects,
        badges: r.u_badges,
        avatar_initials: r.u_avatar_initials,
        institution: r.u_institution,
        created_at: r.u_created_at,
      });
      return { ...mentor, user };
    });

    if (subject && subject !== 'all') {
      list = list.filter((m) => m.expertise.includes(subject));
    }

    return list;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT m.*, u.id as u_id, u.name as u_name, u.email as u_email, u.student_id as u_student_id,
              u.role as u_role, u.reputation as u_reputation, u.subjects as u_subjects,
              u.badges as u_badges, u.avatar_initials as u_avatar_initials, u.institution as u_institution,
              u.created_at as u_created_at
       FROM mentor_profiles m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [id]
    );

    if (!rows.length) return null;

    const r = rows[0];
    const mentor = formatMentor(r);
    const user = formatUser({
      id: r.u_id,
      name: r.u_name,
      email: r.u_email,
      student_id: r.u_student_id,
      role: r.u_role,
      reputation: r.u_reputation,
      subjects: r.u_subjects,
      badges: r.u_badges,
      avatar_initials: r.u_avatar_initials,
      institution: r.u_institution,
      created_at: r.u_created_at,
    });
    return { ...mentor, user };
  },

  async findByUserId(userId) {
    const { rows } = await query('SELECT * FROM mentor_profiles WHERE user_id = $1', [userId]);
    return rows.length ? formatMentor(rows[0]) : null;
  },

  async create({ id, userId, expertise = [], bio, responseTime, department, yearOrDesignation, availability, contactMethod }) {
    const { rows } = await query(
      `INSERT INTO mentor_profiles (id, user_id, expertise, verified, helpful_answers, bio, response_time, department, year_or_designation, availability, contact_method)
       VALUES ($1, $2, $3, TRUE, 0, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, userId, JSON.stringify(expertise), bio, responseTime, department, yearOrDesignation, availability, contactMethod]
    );
    return formatMentor(rows[0]);
  },
};
