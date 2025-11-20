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

  static async getAllProxy() {
  const sql = `
    SELECT
      pf.*, pm.id AS proxy_member_id,
      pm.full_names AS proxy_member_full_names,
      pm.surname AS proxy_member_surname,
      pm.initials AS proxy_member_initials,
      pm.membership_number AS proxy_member_membership_number,
      pm.id_passport_number AS proxy_member_id_passport_number,
      pm.confirmed_full_names AS proxy_member_confirmed_full_names,
      pm.confirmed_surname AS proxy_member_confirmed_surname
    FROM proxy_forms pf
    LEFT JOIN proxy_members pm ON pf.id = pm.proxy_form_id
    WHERE pf.status = 'submitted'
    ORDER BY pf.submitted_at DESC
  `;
    return await database.query(sql);
  }

  static async getProxyFormsByUser(userId) {
  const sql = `
    SELECT
      pf.*, pm.id AS proxy_member_id,
      pm.full_names AS proxy_member_full_names,
      pm.surname AS proxy_member_surname,
      pm.initials AS proxy_member_initials,
      pm.membership_number AS proxy_member_membership_number,
      pm.id_passport_number AS proxy_member_id_passport_number,
      pm.confirmed_full_names AS proxy_member_confirmed_full_names,
      pm.confirmed_surname AS proxy_member_confirmed_surname
    FROM proxy_forms pf
    LEFT JOIN proxy_members pm ON pf.id = pm.proxy_form_id
    WHERE pf.status = 'submitted' AND pf.user_id = ${userId}
    ORDER BY pf.submitted_at DESC
  `;

  return await database.query(sql);
}

static async getAllReg() {
  try {
    // 1. Departments
    const departmentsSql = `
      SELECT id, name
      FROM departments
      ORDER BY name
    `;

    // 2. Managers (eligible employees)
    const managersSql = `
      SELECT e.id AS employee_id, u.name AS manager_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.is_eligible_for_voting = 1
      ORDER BY u.name
    `;

    // 3. Skills used by employees (distinct list)
    const skillsSql = `
      SELECT DISTINCT skill_name
      FROM employee_skills
      WHERE skill_name IS NOT NULL
      ORDER BY skill_name
    `;

    // 4. Achievement categories used by employees
    const achievementCategoriesSql = `
      SELECT DISTINCT category
      FROM employee_achievements
      WHERE category IS NOT NULL
      ORDER BY category
    `;

    const [
      departmentsResult,
      managersResult,
      skillsResult,
      achievementCategoriesResult
    ] = await Promise.all([
      database.query(departmentsSql),
      database.query(managersSql),
      database.query(skillsSql),
      database.query(achievementCategoriesSql)
    ]);

    const departments = (departmentsResult.rows || departmentsResult).map(row => ({
      id: row.id,
      name: row.name
    }));

    const managers = (managersResult.rows || managersResult).map(row => ({
      id: row.employee_id,
      name: row.manager_name
    }));

    const skills = (skillsResult.rows || skillsResult).map(row => ({
      skill_name: row.skill_name
    }));

    const achievementCategories = (achievementCategoriesResult.rows || achievementCategoriesResult).map(row => ({
      category: row.category
    }));

    return {
      departments,
      managers,
      skills,
      achievementCategories
    };
  } catch (error) {
    console.error(' Error loading registration reference data:', error);
    throw new Error('Failed to load registration reference data');
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

  // Check if user exists in employees and employee_logins tables
  static async checkEmployeeStatus(userId) {
    try {
      const sql = `
        SELECT email
        FROM employee_logins
        WHERE user_id = ${userId}
      `;
      const result = await database.query(sql);
      // If no record or email is null/empty, return status
      if (!result.length || !result[0].email || result[0].email.trim() === '') {
        return { emailIsBlank: true };
      }
      return { emailIsBlank: false, email: result[0].email };
    } catch (error) {
      console.error('Error checking employee status:', error);
      throw error;
    }
  }

  
  // Register new employee with skills and achievements
static async registerEmployee(userId, employeeData) {
  const {
    id_type,
    bio,
    skills = [],
    achievements = []
  } = employeeData;

  try {
    // ✅ Get user details
    const userSql = `SELECT name, email FROM users WHERE id = ${userId}`;
    const userResult = await database.query(userSql);

    if (!userResult || userResult.length === 0) {
      throw new Error('User not found');
    }

    const timestamp = Date.now();
    const employeeId = `EMP${timestamp}`;

    // ✅ Insert only columns that exist in employees table
    const employeeSql = `
      INSERT INTO employees (
        user_id, employee_id, position, department_id, bio,
        hire_date, salary, manager_id, is_eligible_for_voting, total_votes,
        created_at, updated_at, created_by, id_type
      )
      VALUES (
        ${userId},
        '${employeeId}',
        'Member', -- Default position
        1,        -- Default department_id
        ${bio ? `'${bio.replace(/'/g, "''")}'` : 'NULL'},
        GETDATE(), -- hire_date
        NULL,      -- salary
        NULL,      -- manager_id
        1,         -- is_eligible_for_voting
        0,         -- total_votes
        GETDATE(),
        GETDATE(),
        'system',
        '${id_type.replace(/'/g, "''")}'
      )
    `;

    console.log('🛠 Employee Insert SQL:', employeeSql);

    try {
      await database.query(employeeSql);
    } catch (err) {
      console.error('❌ SQL Error:', err.message);
      console.error('❌ Failed Query:', employeeSql);
      throw err;
    }

    // ✅ Get the created employee ID
    const getEmpIdSql = `SELECT id FROM employees WHERE employee_id = '${employeeId}'`;
    const empResult = await database.query(getEmpIdSql);
    const newEmployeeId = empResult[0].id;

    // ✅ Insert skills
    if (skills.length > 0) {
      console.log('🛠 Skills:', JSON.stringify(skills, null, 2));
      for (const skill of skills) {
        if (skill.skill_name && skill.skill_name.trim()) {
          const skillSql = `
            INSERT INTO employee_skills (
              employee_id, skill_name, proficiency_level, years_experience, certified, created_at
            )
            VALUES (
              ${newEmployeeId},
              '${skill.skill_name.replace(/'/g, "''")}',
              '${skill.proficiency_level || 'intermediate'}',
              ${skill.years_experience || 0},
              ${skill.certified ? 1 : 0},
              GETDATE()
            )
          `;
          console.log('🛠 Skill Insert SQL:', skillSql);
          await database.query(skillSql);
        }
      }
    }

    // ✅ Insert achievements
    if (achievements.length > 0) {
      console.log('🛠 Achievements:', JSON.stringify(achievements, null, 2));
      for (const achievement of achievements) {
        if (achievement.title && achievement.title.trim()) {
          const achievementSql = `
            INSERT INTO employee_achievements (
              employee_id, title, description, achievement_date, category, points, created_at
            )
            VALUES (
              ${newEmployeeId},
              '${achievement.title.replace(/'/g, "''")}',
              ${achievement.description ? `'${achievement.description.replace(/'/g, "''")}'` : 'NULL'},
              '${achievement.achievement_date}',
              '${achievement.category || 'other'}',
              ${achievement.points || 0},
              GETDATE()
            )
          `;
          console.log('🛠 Achievement Insert SQL:', achievementSql);
          await database.query(achievementSql);
        }
      }
    }

    return {
      employee_id: employeeId,
      message: 'Employee registered successfully'
    };

  } catch (error) {
    console.error('❌ Error registering employee:', error);
    throw error;
  }
}

static async insertAddress(userId, addressData) {
  const { street_address, city, province, postal_code, country } = addressData;

  const sql = `
    INSERT INTO user_address (
      user_id, street_address, city, province, postal_code, country, created_at
    )
    VALUES (
      ${userId},
      '${street_address || ''}',
      '${city || ''}',
      '${province || ''}',
      '${postal_code || ''}',
      '${country || ''}',
      GETDATE()
    )
  `;

  console.log('🛠 User Address Insert SQL:', sql);
  await database.query(sql);
}

  // Get all departments
  static async getDepartments() {
    try {
      const sql = `
        SELECT id, name, description
        FROM departments
        ORDER BY name ASC
      `;
      return await database.query(sql);
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Return default departments if table doesn't exist
      return [
        { id: 1, name: 'Engineering', description: 'Software Development' },
        { id: 2, name: 'Marketing', description: 'Marketing and Sales' },
        { id: 3, name: 'HR', description: 'Human Resources' },
        { id: 4, name: 'Finance', description: 'Finance and Accounting' },
        { id: 5, name: 'Operations', description: 'Operations and Support' }
      ];
    }
  }

  // Get potential managers (existing employees)
  static async getManagers() {
    try {
      const sql = `
        SELECT e.id, u.name, e.position, d.name as department
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.is_eligible_for_voting = 1
        ORDER BY u.name ASC
      `;
      return await database.query(sql);
    } catch (error) {
      console.error('Error fetching managers:', error);
      return [];
    }
  }

  // Get employee by user ID
  static async getEmployeeByUserId(userId) {
    try {
      const sql = `
        SELECT e.id, e.employee_id, u.name, e.position, d.name as department,
               u.avatar_url as avatar, e.bio, e.years_of_service,
               e.total_votes, e.hire_date, u.email, e.created_at, e.updated_at
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.user_id = ${userId}
      `;
      const results = await database.query(sql);
      return results[0] || null;
    } catch (error) {
      console.error('Error fetching employee by user ID:', error);
      throw error;
    }
  }

  // Get employee login by user ID
  static async getEmployeeLoginByUserId(userId) {
    try {
      const sql = `
        SELECT user_id, email, login_method, is_active, 
               account_locked, failed_attempts, last_login,
               created_at, updated_at
        FROM employee_logins
        WHERE user_id = ${userId}
      `;
      const results = await database.query(sql);
      return results[0] || null;
    } catch (error) {
      console.error('Error fetching employee login by user ID:', error);
      throw error;
    }
  }

  static async getProxyFormsByUserId(userId) {
    const sql = `
      SELECT
        id,
        form_id,
        title,
        full_names,
        surname,
        status,
        submitted_at,
        created_at,
        updated_at
      FROM proxy_forms
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    const result = await database.query(sql);
    return result.recordset;
  }

  static async getProxyFormById(formId) {
    try {
      console.log(`Fetching proxy form with ID: ${formId}`);

      const formSql = `SELECT * FROM proxy_forms WHERE form_id = '${formId}'`;
      const formResult = await database.query(formSql);

      if (formResult.recordset.length === 0) {
        console.log(`No proxy form found with ID: ${formId}`);
        return null;
      }

      const form = formResult.recordset[0];
      console.log(`Proxy form found:`, form);

      const membersSql = `SELECT member_name FROM proxy_members WHERE proxy_form_id = ${form.id}`;
      const membersResult = await database.query(membersSql);
      const proxyMembers = membersResult.recordset.map(m => m.member_name);

      console.log(`Proxy members for form ID ${formId}:`, proxyMembers);

      return { form, proxyMembers };
    } catch (error) {
      console.error(`Error fetching proxy form with ID ${formId}:`, error);
      throw error;
    }
  }

  static async getAllEmployees() {
    const sql = `
      SELECT e.id, u.name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE u.active = 1
      ORDER BY u.name
    `;
    const result = await database.query(sql);
    return result.recordset;
  }
}

export default Employee;