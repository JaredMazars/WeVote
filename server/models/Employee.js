import database from "../config/database.js";

class Employee {
  static async getAllForVoting() {
    const sql = `
      SELECT e.id, u.name, e.position, d.name as department,
             u.avatar_url as avatar, e.bio, e.years_of_service,
             e.total_votes, e.updated_at, e.created_at
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
      WHERE e.is_eligible_for_voting = 1
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
      WHERE e.id = ${id} AND e.is_eligible_for_voting = 1
    `;
    const results = await database.query(sql);
    return results[0] || null;
  }

  static async getAchievements(employeeId) {
    try {
      const sql = `
        SELECT title, description, achievement_date, category, points
        FROM employee_achievements
        WHERE employee_id = ${employeeId}
        ORDER BY achievement_date DESC
      `;
      return await database.query(sql);
    } catch (error) {
      console.log('employee_achievements table not found, returning empty array');
      return [];
    }
  }

  static async getSkills(employeeId) {
    try {
      const sql = `
        SELECT skill_name, proficiency_level, years_experience, certified
        FROM employee_skills
        WHERE employee_id = ${employeeId}
        ORDER BY proficiency_level DESC, skill_name ASC
      `;
      return await database.query(sql);
    } catch (error) {
      console.log('employee_skills table not found, returning empty array');
      return [];
    }
  }

  static async create(employeeData) {
    const { name, position, department, bio, email } = employeeData;

    try {
      const timestamp = Date.now();
      const employeeId = `EMP${timestamp}`;
      const hireDate = new Date().toISOString().split('T')[0];

      // Create user record
      const userSql = `
        INSERT INTO users (name, email, password_hash, role_id)
        VALUES ('${name.replace(/'/g, "''")}', '${email}', 'passwordTempHash', 1)
      `;
      await database.query(userSql);
      
      // Get the user ID
      const getUserSql = `SELECT TOP 1 id FROM users WHERE email = '${email}' ORDER BY id DESC`;
      const userResult = await database.query(getUserSql);
      
      if (!userResult || userResult.length === 0) {
        throw new Error('Failed to retrieve created user');
      }
      const userId = userResult[0].id;

      // Find department_id
      const deptSql = `SELECT id FROM departments WHERE name = '${department.replace(/'/g, "''")}'`;
      const deptResult = await database.query(deptSql);
      
      if (!deptResult || deptResult.length === 0) {
        throw new Error(`Department '${department}' not found`);
      }
      const departmentId = deptResult[0].id;

      // Create employee record
      const empSql = `
        INSERT INTO employees (employee_id, user_id, position, department_id, bio, hire_date, is_eligible_for_voting, total_votes)
        VALUES ('${employeeId}', ${userId}, '${position.replace(/'/g, "''")}', ${departmentId}, '${(bio || '').replace(/'/g, "''")}', '${hireDate}', 1, 0)
      `;
      await database.query(empSql);
      
      // Get the employee ID
      const getEmpSql = `SELECT id FROM employees WHERE employee_id = '${employeeId}'`;
      const empResult = await database.query(getEmpSql);
      
      return empResult[0].id;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  static async update(id, employeeData) {
    const { name, position, department, avatar, bio, years_of_service } = employeeData;

    try {
      // Update user table
      const updateUserSql = `
        UPDATE users 
        SET name = '${name.replace(/'/g, "''")}', updated_at = GETDATE()
        WHERE id = (SELECT user_id FROM employees WHERE id = ${id})
      `;
      await database.query(updateUserSql);

      // Find department_id
      const deptSql = `SELECT id FROM departments WHERE name = '${department.replace(/'/g, "''")}'`;
      const deptResult = await database.query(deptSql);
      
      if (!deptResult || deptResult.length === 0) {
        throw new Error(`Department '${department}' not found`);
      }
      const departmentId = deptResult[0].id;

      // Update employee table
      const updateEmpSql = `
        UPDATE employees
        SET position = '${position.replace(/'/g, "''")}', 
            department_id = ${departmentId}, 
            bio = '${(bio || '').replace(/'/g, "''")}', 
            years_of_service = ${years_of_service || 0}, 
            updated_at = GETDATE()
        WHERE id = ${id}
      `;
      await database.query(updateEmpSql);
      
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Delete employee record (hard delete since no is_active column)
      const deleteEmpSql = `DELETE FROM employees WHERE id = ${id}`;
      await database.query(deleteEmpSql);
      
      // Delete user record
      const deleteUserSql = `
        DELETE FROM users 
        WHERE id = (SELECT user_id FROM employees WHERE id = ${id})
      `;
      await database.query(deleteUserSql);
      
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  static async getVotingStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_employees,
        SUM(ISNULL(total_votes, 0)) as total_votes,
        AVG(CAST(ISNULL(total_votes, 0) AS FLOAT)) as avg_votes,
        MAX(ISNULL(total_votes, 0)) as max_votes
      FROM employees
      WHERE is_eligible_for_voting = 1
    `;
    const results = await database.query(sql);
    return results[0];
  }

  static async getTopPerformers(limit = 5) {
    const sql = `
      SELECT TOP (${limit}) e.id, u.name, e.position, d.name as department,
             u.avatar_url as avatar, e.total_votes
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
      WHERE e.is_eligible_for_voting = 1
      ORDER BY e.total_votes DESC
    `;
    return await database.query(sql);
  }
}

export default Employee;