import database from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
static async create(userData) {
  const {
    title,
    email,
    password,
    initials,
    id_number,
    name,
    lastname,
    avatar_url = '',
    role_id,
    good_standing_id_number,
    proxy_vote_form,
    date_of_birth, // varchar(10)
    phone // varchar(10)
  } = userData;

  const password_hash = await bcrypt.hash(password, 12);

  const sql = `
    INSERT INTO users (
      title, email, password_hash, initials, id_number, name, surname,
      avatar_url, role_id, is_active, email_verified, member_number,
      proxy_vote_form, date_of_birth, phone
    )
    OUTPUT INSERTED.id
    VALUES (
      '${title || ''}',
      '${email}',
      '${password_hash}',
      '${initials || ''}',
      '${id_number || ''}',
      '${name}',
      '${lastname}',
      '${avatar_url}',
      ${role_id},
      1,
      0,
      '${good_standing_id_number || ''}',
      '${proxy_vote_form || ''}',
      '${date_of_birth || ''}', -- ✅ Treat as string
      '${phone || ''}'          -- ✅ Treat as string
    )
  `;

  console.log('🛠 User Insert SQL:', sql);

  const result = await database.query(sql);
  if (result && result.length > 0 && result[0].id !== undefined) {
    return result[0].id;
  } else {
    throw new Error('User ID not returned from INSERT');
  }
}



  static async findByEmail(email) {
    const sql = `
      SELECT u.id, u.email, u.password_hash, u.name, u.surname, u.avatar_url, 
             u.role_id, u.is_active, u.email_verified, u.last_login,
             u.created_at, u.updated_at, u.microsoft_id, u.provider,
             u.phone_number, u.created_by, u.updated_by, u.member_number,
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
             u.email_verified, u.last_login, u.created_at, u.member_number,
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
             r.name as role_name, is_active, good_standing
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `;

    const results = await database.query(sql);
    return results;
  }

  static async approveUserById(userId, newPassword) {
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);
  
  const sql = `
    UPDATE users
    SET is_active = 1, password_hash = '${passwordHash}', updated_at = GETDATE()
    WHERE id = ${userId}
  `;

  await database.query(sql);
}

static async logLogin({ userId, email, ipAddress, userAgent }) {
  const sql = `
    INSERT INTO login_logs (user_id, email, ip_address, user_agent)
    VALUES (${userId}, '${email}', '${ipAddress}', '${userAgent}')
  `;
  await database.query(sql);
}


static async approveUserGoodStandingById(userId) {
  const updateSql = `
    UPDATE users
    SET good_standing = 1, role_id = 2,  updated_at = GETDATE()
    WHERE id = ${userId}
  `;
  await database.query(updateSql);

  const fetchSql = `
    SELECT id, email, name, is_active
    FROM users
    WHERE id = ${userId}
  `;
  const result = await database.query(fetchSql);

  return result && result.length > 0 ? result[0] : null;
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

  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 12);
    const sql = `
      UPDATE users
      SET password_hash = '${password_hash}', updated_at = GETDATE()
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

  // Helper method to execute raw SQL queries
  static async executeQuery(query) {
    return await database.query(query);
  }
}



export default User;
