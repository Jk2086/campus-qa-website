import { query } from '../config/db.js';

export function formatResource(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    department: row.department,
    venue: row.venue,
    description: row.description,
    contactMethod: row.contact_method,
    workingHours: row.working_hours,
    createdAt: row.created_at,
  };
}

export const CampusResource = {
  async findAll({ type, department, search } = {}) {
    let sql = 'SELECT * FROM campus_resources WHERE 1=1';
    const params = [];

    if (type) {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }

    if (department) {
      params.push(department);
      sql += ` AND department = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length} OR LOWER(venue) LIKE $${params.length})`;
    }

    sql += ' ORDER BY name ASC';
    const { rows } = await query(sql, params);
    return rows.map(formatResource);
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM campus_resources WHERE id = $1', [id]);
    return rows.length ? formatResource(rows[0]) : null;
  },

  async search(searchTerm) {
    const clean = searchTerm.toLowerCase();
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'in', 'to', 'for', 'of', 'with', 'and', 'or',
      'where', 'what', 'who', 'how', 'when', 'why', 'can', 'should', 'contact', 'handles', 'room',
      'venue', 'my', 'your', 'our', 'this', 'that', 'there', 'here', 'please', 'tell', 'find', 'get'
    ]);
    const words = clean
      .split(/\W+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const all = await this.findAll();
    if (!words.length) {
      const term = `%${clean}%`;
      const { rows } = await query(
        `SELECT * FROM campus_resources
         WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1 OR LOWER(venue) LIKE $1 OR LOWER(type) LIKE $1
         LIMIT 5`,
        [term]
      );
      return rows.map(formatResource);
    }

    const scored = all
      .map((r) => {
        const text = `${r.name} ${r.type} ${r.department} ${r.venue} ${r.description}`.toLowerCase();
        let s = words.filter((w) => text.includes(w)).length;
        return { r, s };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);

    return scored.slice(0, 5).map((x) => x.r);
  },

  async create({ id, name, type, department, venue, description, contactMethod, workingHours }) {
    const { rows } = await query(
      `INSERT INTO campus_resources (id, name, type, department, venue, description, contact_method, working_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, name, type, department, venue, description, contactMethod, workingHours]
    );
    return formatResource(rows[0]);
  },

  format: formatResource,
};
