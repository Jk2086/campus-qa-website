import { query } from '../config/db.js';

export function formatTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

export const Task = {
  async findAll() {
    const { rows } = await query('SELECT * FROM tasks ORDER BY created_at DESC');
    return Promise.all(rows.map(async (row) => {
      const task = formatTask(row);
      const steps = await this.getSteps(task.id);
      return { ...task, steps };
    }));
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (!rows.length) return null;
    const task = formatTask(rows[0]);
    const steps = await this.getSteps(id);
    return { ...task, steps };
  },

  async getSteps(taskId) {
    const { rows } = await query(
      `SELECT ts.id, ts.task_id as "taskId", ts.step_order as "stepOrder",
              ts.instruction, ts.required_role as "requiredRole",
              cr.name as "resourceName", cr.venue as "resourceVenue", cr.contact_method as "resourceContact"
       FROM task_steps ts
       LEFT JOIN campus_resources cr ON ts.resource_id = cr.id
       WHERE ts.task_id = $1
       ORDER BY ts.step_order ASC`,
      [taskId]
    );
    return rows;
  },

  async search(searchTerm) {
    const clean = searchTerm.toLowerCase();
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'in', 'to', 'for', 'of', 'with', 'and', 'or',
      'where', 'what', 'who', 'how', 'when', 'why', 'can', 'should', 'need', 'next', 'steps',
      'workflow', 'my', 'your', 'our', 'this', 'that', 'there', 'here', 'please', 'tell', 'find', 'get'
    ]);
    const words = clean
      .split(/\W+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const all = await this.findAll();
    if (!words.length) {
      return all.slice(0, 5);
    }

    const scored = all
      .map((t) => {
        const text = `${t.title} ${t.description} ${t.category} ${t.steps.map((s) => s.instruction).join(' ')}`.toLowerCase();
        let s = words.filter((w) => text.includes(w)).length;
        return { t, s };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);

    return scored.slice(0, 5).map((x) => x.t);
  },

  format: formatTask,
};
