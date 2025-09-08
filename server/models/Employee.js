import database from "../config/database.js";

class Employee {
  static async getAllForVoting() {
    const sql = `
      SELECT e.id, u.name, e.position, d.name as department,
             u.avatar_url as avatar, e.bio, e.years_of_service,
             e.total_votes, e.created_at
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
      WHERE e.is_eligible_for_voting = 1 AND u.is_active = 1
      ORDER BY e.total_votes DESC
    `;
    return await database.query(sql);
  }

  static async findById(id) {
    const sql = `
      SELECT e.id, u.name, e.position, d.name as department,
             u.avatar_url as avatar, e.bio, e.years_of_service,
             e.total_votes, e.hire_date, e.employee_id,
             u.email, e.created_at, e.updated_at
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
      WHERE e.id = ? AND e.is_eligible_for_voting = 1
    `;
    const results = await database.query(sql, [id]);
    return results[0] || null;
  }

  static async getAchievements(employeeId) {
    const sql = `
      SELECT title, description, achievement_date, category, points
      FROM employee_achievements
      WHERE employee_id = ?
      ORDER BY achievement_date DESC
    `;
    return await database.query(sql, [employeeId]);
  }

  static async getSkills(employeeId) {
    const sql = `
      SELECT skill_name, proficiency_level, years_experience, certified
      FROM employee_skills
      WHERE employee_id = ?
      ORDER BY proficiency_level DESC, skill_name ASC
    `;
    return await database.query(sql, [employeeId]);
  }

  static async create(employeeData) {
    const {
      user_id, employee_id, position, department_id, bio,
      hire_date, salary, manager_id, is_eligible_for_voting = 1
    } = employeeData;

    const sql = `
      INSERT INTO employees (user_id, employee_id, position, department_id, bio,
                             hire_date, salary, manager_id, is_eligible_for_voting)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await database.query(sql, [
      user_id, employee_id, position, department_id, bio,
      hire_date, salary, manager_id, is_eligible_for_voting
    ]);
    return result.insertId;
  }

  static async update(id, employeeData) {
    const {
      position, department_id, bio, salary, manager_id, is_eligible_for_voting
    } = employeeData;

    const sql = `
      UPDATE employees
      SET position = ?, department_id = ?, bio = ?, salary = ?,
          manager_id = ?, is_eligible_for_voting = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await database.query(sql, [
      position, department_id, bio, salary, manager_id, is_eligible_for_voting, id
    ]);
    return true;
  }

  static async getVotingStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_employees,
        SUM(total_votes) as total_votes,
        AVG(total_votes) as avg_votes,
        MAX(total_votes) as max_votes
      FROM employees
      WHERE is_eligible_for_voting = 1
    `;
    const results = await database.query(sql);
    return results[0];
  }

  static async getTopPerformers(limit = 5) {
    const sql = `
      SELECT e.id, u.name, e.position, d.name as department,
             u.avatar_url as avatar, e.total_votes
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
      WHERE e.is_eligible_for_voting = 1 AND u.is_active = 1
      ORDER BY e.total_votes DESC
      LIMIT ?
    `;
    return await database.query(sql, [limit]);
  }
}

export default Employee;