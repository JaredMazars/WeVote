import database from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
  static async create(userData) {
    const { email, password, name, avatar_url, role_id = 2 } = userData;
    const password_hash = await bcrypt.hash(password, 12);

    const sql = `
      INSERT INTO users (email, password_hash, name, avatar_url, role_id, is_active, email_verified)
      VALUES (?, ?, ?, ?, ?, 1, 0)
    `;

    const [result] = await database.query(sql, [email, password_hash, name, avatar_url, role_id]);
    return result.insertId;
  }

  static async findatabaseyEmail(email) {
    const sql = `
      SELECT u.id, u.email, u.password_hash, u.name, u.avatar_url, u.is_active,
             r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ? AND u.is_active = 1
    `;

    const [results] = await database.query(sql, [email]);
    return results[0] || null;
  }

  static async findatabaseyId(id) {
    const sql = `
      SELECT u.id, u.email, u.name, u.avatar_url, u.is_active,
             u.email_verified, u.last_login, u.created_at,
             r.name as role_name, r.description as role_description
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ? AND u.is_active = 1
    `;

    const [results] = await database.query(sql, [id]);
    return results[0] || null;
  }

  static async updateLastLogin(id) {
    const sql = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`;
    await database.query(sql, [id]);
  }

  static async emailExists(email) {
    const sql = `SELECT id FROM users WHERE email = ?`;
    const [results] = await database.query(sql, [email]);
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

    const [results] = await database.query(sql);
    return results;
  }

  static async update(id, userData) {
    const { name, avatar_url, is_active, email_verified } = userData;

    const sql = `
      UPDATE users 
      SET name = ?, avatar_url = ?, is_active = ?, email_verified = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await database.query(sql, [name, avatar_url, is_active, email_verified, id]);
    return true;
  }

  static async softDelete(id) {
    const sql = `UPDATE users SET is_active = 0 WHERE id = ?`;
    await database.query(sql, [id]);
    return true;
  }
}

export default User;
