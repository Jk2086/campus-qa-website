import { query } from '../config/db.js';

export function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    studentId: row.student_id,
    role: row.role,
    reputation: row.reputation,
    subjects: typeof row.subjects === 'string' ? JSON.parse(row.subjects) : row.subjects || [],
    badges: typeof row.badges === 'string' ? JSON.parse(row.badges) : row.badges || [],
    avatarInitials: row.avatar_initials,
    institution: row.institution,
    createdAt: row.created_at,
  };
}

export const User = {
  async findById(id) {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows.length ? rows[0] : null;
  },

  async findByEmailOrStudentId(identifier) {
    const clean = identifier.toLowerCase().trim();
    const { rows } = await query(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(student_id) = $1',
      [clean]
    );
    return rows.length ? rows[0] : null;
  },

  async findByRole(role) {
    const { rows } = await query('SELECT * FROM users WHERE role = $1', [role]);
    return rows.map(formatUser);
  },

  async create({ id, name, email, studentId, passwordHash, role, subjects = [], badges = ['New Member'], avatarInitials, institution }) {
    const { rows } = await query(
      `INSERT INTO users (id, name, email, student_id, password_hash, role, reputation, subjects, badges, avatar_initials, institution)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        name,
        email.toLowerCase().trim(),
        studentId.toUpperCase().trim(),
        passwordHash,
        role || 'student',
        0,
        JSON.stringify(subjects),
        JSON.stringify(badges),
        avatarInitials,
        institution || 'Northfield Institute of Technology',
      ]
    );
    return rows[0];
  },

  async update(id, updates) {
    const user = await this.findById(id);
    if (!user) return null;

    const name = updates.name !== undefined ? updates.name : user.name;
    const reputation = updates.reputation !== undefined ? updates.reputation : user.reputation;
    const subjects = updates.subjects !== undefined ? JSON.stringify(updates.subjects) : JSON.stringify(user.subjects);
    const badges = updates.badges !== undefined ? JSON.stringify(updates.badges) : JSON.stringify(user.badges);

    const { rows } = await query(
      `UPDATE users
       SET name = $1, reputation = $2, subjects = $3, badges = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, reputation, subjects, badges, id]
    );
    return rows[0];
  },

  async addReputation(id, delta) {
    const { rows } = await query(
      'UPDATE users SET reputation = reputation + $1 WHERE id = $2 RETURNING *',
      [delta, id]
    );
    return rows[0];
  },

  format: formatUser,
};
