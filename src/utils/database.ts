import initSqlJs, { Database } from 'sql.js';

class DatabaseService {
  private db: Database | null = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });

      // Create a new database
      this.db = new SQL.Database();

      // Create tables and insert sample data
      await this.createTables();
      await this.insertSampleData();
      
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Create departments table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        avatar_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create employees table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        employee_id TEXT UNIQUE NOT NULL,
        position TEXT NOT NULL,
        department_id INTEGER NOT NULL,
        bio TEXT,
        hire_date DATE,
        years_of_service INTEGER DEFAULT 0,
        salary DECIMAL(10,2),
        manager_id INTEGER,
        total_votes INTEGER DEFAULT 0,
        is_eligible_for_voting INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (manager_id) REFERENCES employees(id)
      )
    `);

    // Create votes table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        voter_id INTEGER NOT NULL,
        vote_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        comment TEXT,
        is_anonymous INTEGER DEFAULT 1,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (voter_id) REFERENCES users(id)
      )
    `);

    // Create employee achievements table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS employee_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        achievement_date DATE,
        category TEXT,
        points INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      )
    `);

    // Create employee skills table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS employee_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        skill_name TEXT NOT NULL,
        proficiency_level INTEGER DEFAULT 1,
        years_experience INTEGER DEFAULT 0,
        certified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      )
    `);
  }

  private async insertSampleData() {
    if (!this.db) throw new Error('Database not initialized');

    // Insert departments
    const departments = [
      ['Engineering', 'Software development and technical innovation'],
      ['Marketing', 'Brand promotion and customer engagement'],
      ['Sales', 'Revenue generation and client relationships'],
      ['HR', 'Human resources and talent management'],
      ['Finance', 'Financial planning and analysis'],
      ['Operations', 'Business operations and process optimization']
    ];

    departments.forEach(([name, description]) => {
      this.db!.run('INSERT OR IGNORE INTO departments (name, description) VALUES (?, ?)', [name, description]);
    });

    // Insert users
    const users = [
      ['Sarah Johnson', 'sarah.johnson@company.com', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'],
      ['Michael Chen', 'michael.chen@company.com', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400'],
      ['Emily Rodriguez', 'emily.rodriguez@company.com', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400'],
      ['David Kim', 'david.kim@company.com', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=400'],
      ['Jessica Thompson', 'jessica.thompson@company.com', 'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=400'],
      ['Alex Martinez', 'alex.martinez@company.com', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400'],
      ['Rachel Green', 'rachel.green@company.com', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'],
      ['James Wilson', 'james.wilson@company.com', 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400'],
      ['Lisa Anderson', 'lisa.anderson@company.com', 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400']
    ];

    users.forEach(([name, email, avatar]) => {
      this.db!.run('INSERT OR IGNORE INTO users (name, email, avatar_url) VALUES (?, ?, ?)', [name, email, avatar]);
    });

    // Insert employees
    const employees = [
      [1, 'EMP001', 'Senior Software Engineer', 1, 'Passionate full-stack developer with expertise in React and Node.js. Known for mentoring junior developers and leading innovative projects.', '2020-03-15', 4, 95000, null, 15],
      [2, 'EMP002', 'Marketing Manager', 2, 'Creative marketing professional with a track record of successful campaigns. Excellent at building brand awareness and customer engagement.', '2019-08-20', 5, 78000, null, 22],
      [3, 'EMP003', 'UX Designer', 1, 'User-centered design expert who creates intuitive and beautiful interfaces. Strong advocate for accessibility and inclusive design.', '2021-01-10', 3, 72000, null, 18],
      [4, 'EMP004', 'Sales Director', 3, 'Results-driven sales leader with exceptional client relationship skills. Consistently exceeds targets and builds lasting partnerships.', '2018-05-12', 6, 105000, null, 28],
      [5, 'EMP005', 'HR Specialist', 4, 'People-focused HR professional dedicated to creating positive workplace culture. Expert in talent acquisition and employee development.', '2020-09-01', 4, 65000, null, 12],
      [6, 'EMP006', 'DevOps Engineer', 1, 'Infrastructure and automation specialist ensuring reliable and scalable systems. Passionate about CI/CD and cloud technologies.', '2021-06-15', 3, 88000, 1, 20],
      [7, 'EMP007', 'Product Manager', 1, 'Strategic product leader with strong analytical skills. Excellent at translating user needs into actionable development roadmaps.', '2019-11-30', 5, 92000, null, 25],
      [8, 'EMP008', 'Financial Analyst', 5, 'Detail-oriented financial professional with expertise in budgeting and forecasting. Strong analytical and problem-solving skills.', '2020-02-14', 4, 70000, null, 14],
      [9, 'EMP009', 'Operations Manager', 6, 'Process optimization expert focused on efficiency and quality improvement. Great at cross-functional collaboration and project management.', '2018-12-03', 6, 82000, null, 19]
    ];

    employees.forEach(([user_id, employee_id, position, department_id, bio, hire_date, years_of_service, salary, manager_id, total_votes]) => {
      this.db!.run(`
        INSERT OR IGNORE INTO employees 
        (user_id, employee_id, position, department_id, bio, hire_date, years_of_service, salary, manager_id, total_votes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [user_id, employee_id, position, department_id, bio, hire_date, years_of_service, salary, manager_id, total_votes]);
    });

    // Insert achievements
    const achievements = [
      [1, 'Innovation Award 2023', 'Led the development of the new customer portal', '2023-12-01', 'Technical', 100],
      [1, 'Mentor of the Year', 'Mentored 5 junior developers successfully', '2023-06-15', 'Leadership', 75],
      [2, 'Campaign Excellence', 'Increased brand awareness by 40%', '2023-09-20', 'Marketing', 90],
      [4, 'Top Performer Q3', 'Exceeded sales targets by 150%', '2023-09-30', 'Sales', 120],
      [7, 'Product Launch Success', 'Successfully launched 3 major features', '2023-11-10', 'Product', 85]
    ];

    achievements.forEach(([employee_id, title, description, achievement_date, category, points]) => {
      this.db!.run(`
        INSERT OR IGNORE INTO employee_achievements 
        (employee_id, title, description, achievement_date, category, points) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [employee_id, title, description, achievement_date, category, points]);
    });

    // Insert skills
    const skills = [
      [1, 'React', 5, 4, 1],
      [1, 'Node.js', 4, 4, 1],
      [1, 'TypeScript', 4, 3, 0],
      [2, 'Digital Marketing', 5, 5, 1],
      [2, 'Content Strategy', 4, 4, 0],
      [3, 'UI/UX Design', 5, 3, 1],
      [3, 'Figma', 5, 3, 0],
      [4, 'Sales Strategy', 5, 6, 1],
      [4, 'CRM Management', 4, 5, 1]
    ];

    skills.forEach(([employee_id, skill_name, proficiency_level, years_experience, certified]) => {
      this.db!.run(`
        INSERT OR IGNORE INTO employee_skills 
        (employee_id, skill_name, proficiency_level, years_experience, certified) 
        VALUES (?, ?, ?, ?, ?)
      `, [employee_id, skill_name, proficiency_level, years_experience, certified]);
    });
  }

  // Employee queries
  async getAllEmployeesForVoting() {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT e.id, u.name, e.position, d.name as department,
             u.avatar_url as avatar, e.bio, e.years_of_service,
             e.total_votes, e.created_at
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
      WHERE e.is_eligible_for_voting = 1 AND u.is_active = 1
      ORDER BY e.total_votes DESC
    `);

    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  async getEmployeeById(id: number) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT e.id, u.name, e.position, d.name as department,
             u.avatar_url as avatar, e.bio, e.years_of_service,
             e.total_votes, e.hire_date, e.employee_id,
             u.email, e.created_at, e.updated_at
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
      WHERE e.id = ? AND e.is_eligible_for_voting = 1
    `);

    stmt.bind([id]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  async getEmployeeAchievements(employeeId: number) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT title, description, achievement_date, category, points
      FROM employee_achievements
      WHERE employee_id = ?
      ORDER BY achievement_date DESC
    `);

    stmt.bind([employeeId]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  async getEmployeeSkills(employeeId: number) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT skill_name, proficiency_level, years_experience, certified
      FROM employee_skills
      WHERE employee_id = ?
      ORDER BY proficiency_level DESC, skill_name ASC
    `);

    stmt.bind([employeeId]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  async castVote(voteData: {
    voter_id: number;
    vote_type: string;
    target_id: number;
    comment?: string;
    is_anonymous?: number;
    ip_address?: string;
    user_agent?: string;
  }) {
    if (!this.db) throw new Error('Database not initialized');

    // Check if user has already voted
    const checkStmt = this.db.prepare(`
      SELECT id FROM votes 
      WHERE voter_id = ? AND vote_type = ? AND target_id = ?
    `);
    checkStmt.bind([voteData.voter_id, voteData.vote_type, voteData.target_id]);
    
    if (checkStmt.step()) {
      checkStmt.free();
      throw new Error('User has already voted for this item');
    }
    checkStmt.free();

    // Insert the vote
    const insertStmt = this.db.prepare(`
      INSERT INTO votes (voter_id, vote_type, target_id, comment, is_anonymous, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run([
      voteData.voter_id,
      voteData.vote_type,
      voteData.target_id,
      voteData.comment || null,
      voteData.is_anonymous || 1,
      voteData.ip_address || null,
      voteData.user_agent || null
    ]);

    // Update the total votes count
    if (voteData.vote_type === 'employee') {
      const updateStmt = this.db.prepare('UPDATE employees SET total_votes = total_votes + 1 WHERE id = ?');
      updateStmt.run([voteData.target_id]);
      updateStmt.free();
    }

    insertStmt.free();
    return true;
  }

  async hasUserVoted(userId: number, voteType: string, targetId: number) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT id FROM votes 
      WHERE voter_id = ? AND vote_type = ? AND target_id = ?
    `);
    
    stmt.bind([userId, voteType, targetId]);
    const hasVoted = stmt.step();
    stmt.free();
    return hasVoted;
  }

  async getVotingStats() {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_employees,
        SUM(total_votes) as total_votes,
        AVG(total_votes) as avg_votes,
        MAX(total_votes) as max_votes
      FROM employees
      WHERE is_eligible_for_voting = 1
    `);

    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();
    return result;
  }

  async getTopPerformers(limit: number = 5) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT e.id, u.name, e.position, d.name as department,
             u.avatar_url as avatar, e.total_votes
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN departments d ON e.department_id = d.id
      WHERE e.is_eligible_for_voting = 1 AND u.is_active = 1
      ORDER BY e.total_votes DESC
      LIMIT ?
    `);

    stmt.bind([limit]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
}

// Create singleton instance
const databaseService = new DatabaseService();
export default databaseService;