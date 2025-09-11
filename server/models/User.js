import database from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
  static async create(userData) {
    const { email, password, name, avatar_url, role_id = 1 } = userData;
    const password_hash = await bcrypt.hash(password, 12);

    const sql = `
      INSERT INTO users (email, password_hash, name, avatar_url, role_id, is_active, email_verified)
      VALUES ('${email}', '${password_hash}', '${name}', '${avatar_url || ''}', ${role_id}, 1, 0)
    `;

    await database.query(sql);
    const getIdSql = `SELECT SCOPE_IDENTITY() as id`;
    const result = await database.query(getIdSql);
    return result[0].id;
  }

  static async findByEmail(email) {
    const sql = `
      SELECT u.id, u.email, u.password_hash, u.name, u.avatar_url, 
             u.role_id, u.is_active, u.email_verified, u.last_login,
             u.created_at, u.updated_at, u.microsoft_id, u.provider,
             u.phone_number, u.created_by, u.updated_by,
             r.name as role_name, r.description as role_description, r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = '${email}' AND u.is_active = 1
    `;
    
    const results = await database.query(sql);
    return results[0] || null;
  }
  

  static async findById(id) {
    const sql = `
      SELECT u.id, u.email, u.name, u.avatar_url, u.is_active,
             u.email_verified, u.last_login, u.created_at,
             r.name as role_name, r.description as role_description
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${id} AND u.is_active = 1
    `;

    const results = await database.query(sql);
    return results[0] || null;
  }

  static async updateLastLogin(id) {
    const sql = `UPDATE users SET last_login = GETDATE() WHERE id = ${id}`;
    await database.query(sql);
  }

  static async emailExists(email) {
    const sql = `SELECT id FROM users WHERE email = '${email}'`;
    const results = await database.query(sql);
    return results.length > 0;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll() {
    const sql = `
      SELECT u.id, u.email, u.name, u.avatar_url, u.is_active,
             u.email_verified, u.last_login, u.created_at,
             r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = 1
      ORDER BY u.created_at DESC
    `;

    const results = await database.query(sql);
    return results;
  }

  static async update(id, userData) {
    const { name, avatar_url, is_active, email_verified } = userData;

    const sql = `
      UPDATE users 
      SET name = '${name}', avatar_url = '${avatar_url || ''}', is_active = ${is_active ? 1 : 0}, 
          email_verified = ${email_verified ? 1 : 0}, updated_at = GETDATE()
      WHERE id = ${id}
    `;

    await database.query(sql);
    return true;
  }

  static async softDelete(id) {
    const sql = `UPDATE users SET is_active = 0 WHERE id = ${id}`;
    await database.query(sql);
    return true;
  }
}

export default User;
