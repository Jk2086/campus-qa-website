import { query } from '../config/db.js';

export function formatUser(row) {
  if (!row) return null;
  const subjects = typeof row.subjects === 'string'
    ? JSON.parse(row.subjects)
    : (Array.isArray(row.subjects) ? row.subjects : []);
  const badges = typeof row.badges === 'string'
    ? JSON.parse(row.badges)
    : (Array.isArray(row.badges) ? row.badges : []);
  const dept = row.mentor_department || row.department || (subjects.length > 0 ? subjects[0] : 'General Academics');
  const studentId = row.student_id || row.studentId || '';
  const year = row.year || row.year_or_designation || (studentId.includes('22') ? '3rd Year' : studentId.includes('21') ? '4th Year' : '2nd Year');

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    studentId,
    role: row.role,
    department: dept,
    year,
    reputation: row.reputation !== undefined ? row.reputation : 0,
    subjects,
    badges,
    avatarInitials: row.avatar_initials || row.avatarInitials || (row.name ? row.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'),
    institution: row.institution || 'Northfield Institute of Technology',
    bio: row.bio || '',
    availability: row.availability || 'available',
    createdAt: row.created_at || row.createdAt,
  };
}

export const User = {
  async findAll({ role, department } = {}) {
    let sql = `
      SELECT u.*, mp.department as mentor_department, mp.year_or_designation, mp.availability, mp.bio
      FROM users u
      LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'all') {
      params.push(role);
      sql += ` AND u.role = $${params.length}`;
    }

    sql += ' ORDER BY u.reputation DESC';
    const { rows } = await query(sql, params);
    let list = rows.map(formatUser);

    if (department && department !== 'all') {
      list = list.filter((u) => u.department.toLowerCase().includes(department.toLowerCase()));
    }

    return list;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT u.*, mp.department as mentor_department, mp.year_or_designation, mp.availability, mp.bio
       FROM users u
       LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
       WHERE u.id = $1`,
      [id]
    );
    return rows.length ? formatUser(rows[0]) : null;
  },

  async findRawById(id) {
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
    return this.findAll({ role });
  },

  async updateAvailability(id, availability) {
    await query(
      'UPDATE mentor_profiles SET availability = $1 WHERE user_id = $2',
      [availability, id]
    );
    const user = await this.findById(id);
    if (user) {
      user.availability = availability;
    }
    return user;
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
