// =====================================================
// Users Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const User = require('../models/User');
const { validate } = require('../middleware/validator');
const { authorizeRoles } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// ── helper: auto-assign the org's minimum vote allocation to a newly-activated voter
async function autoAssignMinVotes(pool, sql, userId, organizationId, adminId) {
  try {
    const VoteSplittingSettings = require('../models/VoteSplittingSettings');
    const settings = await VoteSplittingSettings.getByOrganization(organizationId);
    const minVotes = settings?.MinIndividualVotes ?? 2;

    // Find all active/scheduled sessions for this org
    const sessionsResult = await pool.request()
      .input('orgId', sql.Int, organizationId)
      .query(`
        SELECT SessionID FROM Sessions
        WHERE OrganizationID = @orgId
          AND Status IN ('scheduled', 'in_progress')
      `);

    for (const row of sessionsResult.recordset) {
      const sessionId = row.SessionID;

      // Only create if no allocation exists yet
      const existing = await pool.request()
        .input('uid', sql.Int, userId)
        .input('sid', sql.Int, sessionId)
        .query(`SELECT AllocationID FROM VoteAllocations WHERE UserID = @uid AND SessionID = @sid`);

      if (existing.recordset.length === 0) {
        await pool.request()
          .input('uid', sql.Int, userId)
          .input('sid', sql.Int, sessionId)
          .input('votes', sql.Int, minVotes)
          .input('setBy', sql.Int, adminId)
          .query(`
            INSERT INTO VoteAllocations (UserID, SessionID, AllocatedVotes, Reason, BasedOn, SetBy, CreatedAt, UpdatedAt)
            VALUES (@uid, @sid, @votes, 'Default minimum allocation on approval', 'default_min', @setBy, GETDATE(), GETDATE())
          `);
        logger.info(`Auto-assigned ${minVotes} votes to user ${userId} for session ${sessionId}`);
      }
    }
  } catch (err) {
    logger.warn(`autoAssignMinVotes failed (non-fatal): ${err.message}`);
  }
}

// @route   POST /api/users
// @desc    Create new user (Admin and Super Admin only)
// @access  Private
router.post('/', [
  authorizeRoles('admin', 'super_admin'),
  body('email').isEmail().withMessage('Valid email required'),
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['user', 'voter', 'admin', 'auditor']).withMessage('Invalid role'),
  body('phoneNumber').optional().isMobilePhone(),
  validate,
  asyncHandler(async (req, res) => {
    const { email, firstName, lastName, password, role, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    const userData = {
      organizationId: req.user.organizationId || 1,
      email,
      password,
      firstName,
      lastName,
      role: role || 'user',
      phoneNumber: phoneNumber || null
    };

    const newUser = await User.create(userData);

    // Remove sensitive data
    delete newUser.PasswordHash;
    delete newUser.Salt;

    logger.info(`User created by admin ${req.user.userId}: ${newUser.Email}`);

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  })
]);

// @route   GET /api/users
// @desc    Get all users (Admin and Super Admin only)
// @access  Private
router.get('/', [
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { role, isActive } = req.query;
    
    const filters = {
      organizationId: req.user.organizationId
    };

    if (role) {
      // Support comma-separated roles: role=admin,auditor
      filters.roles = role.includes(',') ? role.split(',') : [role];
    }
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const users = await User.findAll(filters);

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { PasswordHash, Salt, ...safeUser } = user;
      return safeUser;
    });

    res.json({
      count: sanitizedUsers.length,
      users: sanitizedUsers
    });
  })
]);

// @route   GET /api/users/pending/registrations
// @desc    Get all user registrations (for admin approval interface)
// @access  Private (Admin/Super Admin)
router.get('/pending/registrations', [
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { executeQuery } = require('../config/database');

    const result = await executeQuery(`
      SELECT 
        u.UserID as id,
        u.FirstName + ' ' + u.LastName as name,
        u.FirstName as first_name,
        u.LastName as last_name,
        u.Email as email,
        u.PhoneNumber as phone,
        u.Role as role_name,
        u.IsActive as active,
        u.IsGoodStanding,
        u.RequiresPasswordChange,
        CASE 
          WHEN u.IsActive = 1 THEN 'approved'
          WHEN u.IsActive = 0 THEN 'pending'
          ELSE 'rejected'
        END as registration_status,
        u.CreatedAt as created_at,
        u.UpdatedAt as updated_at,
        -- enrolled sessions (comma-separated IDs)
        STUFF((
          SELECT ',' + CAST(va.SessionID AS NVARCHAR)
          FROM VoteAllocations va
          WHERE va.UserID = u.UserID
          FOR XML PATH('')
        ), 1, 1, '') as enrolled_session_ids,
        -- enrolled session titles
        STUFF((
          SELECT '|' + s.Title
          FROM VoteAllocations va
          INNER JOIN AGMSessions s ON s.SessionID = va.SessionID
          WHERE va.UserID = u.UserID
          FOR XML PATH('')
        ), 1, 1, '') as enrolled_session_titles
      FROM Users u
      WHERE u.RequiresPasswordChange = 1
      ORDER BY u.CreatedAt DESC
    `);

    // Parse session ids/titles into arrays
    const data = result.recordset.map(row => ({
      ...row,
      enrolled_session_ids: row.enrolled_session_ids
        ? row.enrolled_session_ids.split(',').map(Number)
        : [],
      enrolled_session_titles: row.enrolled_session_titles
        ? row.enrolled_session_titles.split('|')
        : []
    }));

    res.json({
      success: true,
      data,
      count: data.length
    });
  })
]);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', [
  param('id').isInt().withMessage('Valid user ID required'),
  validate,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    // Users can only view their own profile unless admin/super_admin
    if (userId !== req.user.userId && 
        !['admin', 'super_admin'].includes(req.user.role)) {
      throw new AppError('Access denied', 403);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove sensitive data
    delete user.PasswordHash;
    delete user.Salt;

    res.json({ user });
  })
]);

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', [
  param('id').isInt().withMessage('Valid user ID required'),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phoneNumber').optional().isMobilePhone(),
  validate,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    // Users can only update their own profile unless admin/super_admin
    if (userId !== req.user.userId && 
        !['admin', 'super_admin'].includes(req.user.role)) {
      throw new AppError('Access denied', 403);
    }

    const updatedUser = await User.updateProfile(userId, req.body);

    // Remove sensitive data
    delete updatedUser.PasswordHash;
    delete updatedUser.Salt;

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  })
]);

// @route   PUT /api/users/:id/approve
// @desc    Approve a pending user registration - generates password, sends email, logs to audit
// @access  Private (Admin/Super Admin)
router.put('/:id/approve', [
  param('id').isInt().withMessage('Valid user ID required'),
  validate,
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const sql = require('mssql');
    const { getPool, executeQuery } = require('../config/database');
    const pool = await getPool();
    const User = require('../models/User');
    const { sendUserApprovalEmail } = require('../services/emailService');

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate random password (12 characters: uppercase, lowercase, numbers)
    const generatePassword = () => {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const all = uppercase + lowercase + numbers;
      
      let password = '';
      // Ensure at least one of each type
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      
      // Fill the rest randomly
      for (let i = 3; i < 12; i++) {
        password += all[Math.floor(Math.random() * all.length)];
      }
      
      // Shuffle the password
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    const generatedPassword = generatePassword();

    // Update user password with generated password
    await User.changePassword(userId, generatedPassword);

    // Update user to active but keep RequiresPasswordChange = 1 (they must change on first login)
    await pool.request()
      .input('userId', sql.Int, userId)
      .query`
        UPDATE Users 
        SET IsActive = 1, 
            RequiresPasswordChange = 1,
            UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `;

    // Auto-assign minimum votes for all active/scheduled sessions
    await autoAssignMinVotes(pool, sql, userId, user.OrganizationID, req.user.userId);

    // Send email with generated password
    try {
      await sendUserApprovalEmail({
        email: user.Email,
        firstName: user.FirstName,
        password: generatedPassword
      });
      logger.info(`Approval email sent to ${user.Email} with generated password`);
    } catch (emailError) {
      logger.error(`Failed to send approval email to ${user.Email}:`, emailError);
      // Don't fail the approval if email fails, but log it
    }

    // Log to audit
    try {
      await executeQuery(`
        INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
        VALUES (@adminUserId, @action, @entityType, @entityId, @details, @ipAddress, @userAgent, GETDATE())
      `, {
        adminUserId: req.user.userId,
        action: 'USER_APPROVED',
        entityType: 'User',
        entityId: userId,
        details: `Approved user registration for ${user.Email}. Generated password sent via email.`,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      });
    } catch (auditError) {
      logger.error('Failed to log approval to audit:', auditError);
      // Don't fail the approval if audit logging fails
    }

    res.json({
      success: true,
      message: 'User registration approved successfully. Password generated and email sent.'
    });
  })
]);

// @route   PUT /api/users/:id/reject
// @desc    Reject a pending user registration
// @access  Private (Admin/Super Admin)
router.put('/:id/reject', [
  param('id').isInt().withMessage('Valid user ID required'),
  body('reason').optional().isString(),
  validate,
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const sql = require('mssql');
    const { getPool } = require('../config/database');
    const pool = await getPool();

    // Delete the rejected user
    await pool.request()
      .input('userId', sql.Int, userId)
      .query`DELETE FROM Users WHERE UserID = @userId`;

    res.json({
      success: true,
      message: 'User registration rejected and removed'
    });
  })
]);

// @route   PUT /api/users/:id/approve-as-voter
// @desc    Step 1 approval: activate account + set role=voter + generate temp password + email credentials
//          Good standing is NOT set here — use PATCH /:id/good-standing as the separate step 2
// @access  Private (Admin/Super Admin)
router.put('/:id/approve-as-voter', [
  param('id').isInt().withMessage('Valid user ID required'),
  body('sessionIds').optional().isArray().withMessage('sessionIds must be an array'),
  validate,
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { sessionIds } = req.body; // optional – specific sessions to enrol the voter in
    const sql = require('mssql');
    const { getPool, executeQuery } = require('../config/database');
    const pool = await getPool();
    const { sendVoterPromotionEmail } = require('../services/emailService');

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    // Activate + promote to voter. IsGoodStanding stays 0 — must be granted separately.
    await pool.request()
      .input('userId', sql.Int, userId)
      .query`
        UPDATE Users
        SET IsActive = 1,
            Role = 'voter',
            RequiresPasswordChange = 1,
            UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `;

    // Assign to specific sessions if provided, otherwise fall back to all active/scheduled
    if (sessionIds && sessionIds.length > 0) {
      try {
        const VoteSplittingSettings = require('../models/VoteSplittingSettings');
        const settings = await VoteSplittingSettings.getByOrganization(user.OrganizationID);
        const minVotes = settings?.MinIndividualVotes ?? 2;

        for (const sessionId of sessionIds) {
          const existing = await pool.request()
            .input('uid', sql.Int, userId)
            .input('sid', sql.Int, sessionId)
            .query(`SELECT AllocationID FROM VoteAllocations WHERE UserID = @uid AND SessionID = @sid`);

          if (existing.recordset.length === 0) {
            await pool.request()
              .input('uid', sql.Int, userId)
              .input('sid', sql.Int, sessionId)
              .input('votes', sql.Int, minVotes)
              .input('setBy', sql.Int, req.user.userId)
              .query(`
                INSERT INTO VoteAllocations (UserID, SessionID, AllocatedVotes, Reason, BasedOn, SetBy, CreatedAt, UpdatedAt)
                VALUES (@uid, @sid, @votes, 'Assigned during voter approval', 'admin_assigned', @setBy, GETDATE(), GETDATE())
              `);
            logger.info(`Assigned user ${userId} to session ${sessionId} with ${minVotes} votes`);
          }
        }
      } catch (err) {
        logger.warn(`Session assignment during approval failed (non-fatal): ${err.message}`);
      }
    } else {
      // No sessions specified — auto-assign to all active/scheduled sessions
      await autoAssignMinVotes(pool, sql, userId, user.OrganizationID, req.user.userId);
    }

    // Generate a password if none exists (same logic as /approve)
    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let pw = 'A1';
      for (let i = 2; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
      return pw.split('').sort(() => Math.random() - 0.5).join('');
    };
    const generatedPassword = generatePassword();
    await User.changePassword(userId, generatedPassword);

    // Send voter promotion email with login credentials
    try {
      await sendVoterPromotionEmail({ email: user.Email, firstName: user.FirstName, password: generatedPassword });
    } catch (emailErr) {
      logger.warn('Voter promotion email failed (non-fatal):', emailErr.message);
    }

    // Audit log
    try {
      await executeQuery(`
        INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
        VALUES (@adminId, 'USER_APPROVED_AS_VOTER', 'User', @uid, @details, @ip, @ua, GETDATE())
      `, {
        adminId: req.user.userId,
        uid: userId,
        details: `User ${user.Email} approved and activated as voter by admin ${req.user.userId}. Good standing not yet granted.`,
        ip: req.ip || 'unknown',
        ua: req.headers['user-agent'] || 'unknown'
      });
    } catch (auditErr) {
      logger.warn('Audit log failed (non-fatal):', auditErr.message);
    }

    logger.info(`User ${userId} approved as voter (access granted) by admin ${req.user.userId}. Good standing pending.`);
    res.json({ success: true, message: 'Account activated as voter. Login credentials emailed. Good standing must be granted separately.' });
  })
]);

// @route   POST /api/users/:id/assign-sessions
// @desc    Assign (or remove) an already-approved voter to/from one or more sessions
// @access  Private (Admin/Super Admin)
router.post('/:id/assign-sessions', [
  param('id').isInt().withMessage('Valid user ID required'),
  body('sessionIds').isArray({ min: 0 }).withMessage('sessionIds must be an array'),
  body('replaceAll').optional().isBoolean(),
  validate,
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { sessionIds, replaceAll = false } = req.body;
    const sql = require('mssql');
    const { getPool, executeQuery } = require('../config/database');
    const pool = await getPool();

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    if (replaceAll) {
      // Remove all existing allocations not in the new list
      const existing = await executeQuery(
        `SELECT SessionID FROM VoteAllocations WHERE UserID = @userId`,
        { userId }
      );
      for (const row of existing.recordset) {
        if (!sessionIds.includes(row.SessionID)) {
          await executeQuery(
            `DELETE FROM VoteAllocations WHERE UserID = @userId AND SessionID = @sid`,
            { userId, sid: row.SessionID }
          );
        }
      }
    }

    const VoteSplittingSettings = require('../models/VoteSplittingSettings');
    let minVotes = 2;
    try {
      const settings = await VoteSplittingSettings.getByOrganization(user.OrganizationID);
      minVotes = settings?.MinIndividualVotes ?? 2;
    } catch { /* use default */ }

    const added = [];
    const skipped = [];
    for (const sessionId of sessionIds) {
      const existing = await pool.request()
        .input('uid', sql.Int, userId)
        .input('sid', sql.Int, sessionId)
        .query(`SELECT AllocationID FROM VoteAllocations WHERE UserID = @uid AND SessionID = @sid`);

      if (existing.recordset.length === 0) {
        await pool.request()
          .input('uid', sql.Int, userId)
          .input('sid', sql.Int, sessionId)
          .input('votes', sql.Int, minVotes)
          .input('setBy', sql.Int, req.user.userId)
          .query(`
            INSERT INTO VoteAllocations (UserID, SessionID, AllocatedVotes, Reason, BasedOn, SetBy, CreatedAt, UpdatedAt)
            VALUES (@uid, @sid, @votes, 'Manual session assignment by admin', 'admin_assigned', @setBy, GETDATE(), GETDATE())
          `);
        added.push(sessionId);
      } else {
        skipped.push(sessionId);
      }
    }

    logger.info(`Session assignment updated for user ${userId} by admin ${req.user.userId}: added=${added}, skipped=${skipped}`);

    res.json({
      success: true,
      message: `Session assignments updated. Added: ${added.length}, Already enrolled: ${skipped.length}`,
      added,
      skipped
    });
  })
]);

// @route   PATCH /api/users/:id/good-standing
// @desc    Set or revoke good standing for a voter (does NOT change role)
// @access  Private (Admin/Super Admin)
router.patch('/:id/good-standing', [
  param('id').isInt().withMessage('Valid user ID required'),
  body('isGoodStanding').isBoolean().withMessage('isGoodStanding must be boolean'),
  body('note').optional().isString(),
  validate,
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { isGoodStanding, note } = req.body;
    const sql = require('mssql');
    const { getPool, executeQuery } = require('../config/database');
    const pool = await getPool();

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    await pool.request()
      .input('userId', sql.Int, userId)
      .input('isGs', sql.Bit, isGoodStanding ? 1 : 0)
      .input('note', sql.NVarChar, note || null)
      .query`
        UPDATE Users
        SET IsGoodStanding = @isGs, GoodStandingNote = @note, UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `;

    // Auto-assign min votes when granting good standing (only if not already allocated)
    if (isGoodStanding) {
      await autoAssignMinVotes(pool, sql, userId, user.OrganizationID, req.user.userId);
    }

    // Audit log
    try {
      await executeQuery(`
        INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
        VALUES (@adminId, @action, 'User', @uid, @details, @ip, @ua, GETDATE())
      `, {
        adminId: req.user.userId,
        action: isGoodStanding ? 'USER_GOOD_STANDING_RESTORED' : 'USER_GOOD_STANDING_REVOKED',
        uid: userId,
        details: `Good standing ${isGoodStanding ? 'restored' : 'revoked'} for ${user.Email}. Note: ${note || 'N/A'}`,
        ip: req.ip || 'unknown',
        ua: req.headers['user-agent'] || 'unknown'
      });
    } catch (auditErr) {
      logger.warn('Audit log for good standing change failed (non-fatal):', auditErr.message);
    }

    logger.info(`User ${userId} good standing set to ${isGoodStanding} by admin ${req.user.userId}`);
    res.json({ success: true, message: `Good standing ${isGoodStanding ? 'restored' : 'revoked'} successfully` });
  })
]);

// @route   PATCH /api/users/:id/status
// @desc    Activate or deactivate a user account (no re-approval needed to re-activate)
// @access  Private (Admin/Super Admin)
router.patch('/:id/status', [
  param('id').isInt().withMessage('Valid user ID required'),
  body('isActive').isBoolean().withMessage('isActive (boolean) is required'),
  validate,
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;
    const sql = require('mssql');
    const { getPool, executeQuery } = require('../config/database');
    const pool = await getPool();

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    await pool.request()
      .input('userId', sql.Int, userId)
      .input('isActive', sql.Bit, isActive ? 1 : 0)
      .query('UPDATE Users SET IsActive = @isActive, UpdatedAt = GETDATE() WHERE UserID = @userId');

    try {
      await executeQuery(`
        INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
        VALUES (@adminId, @action, @entityType, @entityId, @details, @ip, @ua, GETDATE())
      `, {
        adminId: req.user.userId,
        action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: userId,
        details: `User ${user.Email} ${isActive ? 'activated' : 'deactivated'} by admin ${req.user.userId}`,
        ip: req.ip || 'unknown',
        ua: req.headers['user-agent'] || 'unknown'
      });
    } catch (auditErr) {
      logger.warn('Audit log failed for status change (non-fatal):', auditErr.message);
    }

    logger.info(`User ${userId} ${isActive ? 'activated' : 'deactivated'} by admin ${req.user.userId}`);
    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
  })
]);

// @route   PATCH /api/users/:id/role
// @desc    Update a user's role (promote to voter, demote back to user, etc.)
// @access  Private (Admin/Super Admin)
router.patch('/:id/role', [
  param('id').isInt().withMessage('Valid user ID required'),
  body('role').isIn(['user', 'voter', 'admin', 'auditor']).withMessage('Invalid role'),
  validate,
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    const sql = require('mssql');
    const { getPool, executeQuery } = require('../config/database');
    const pool = await getPool();

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const previousRole = user.Role;

    await pool.request()
      .input('userId', sql.Int, userId)
      .input('role', sql.NVarChar, role)
      .query`UPDATE Users SET Role = @role, UpdatedAt = GETDATE() WHERE UserID = @userId`;

    // Audit log
    try {
      await executeQuery(`
        INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details, IPAddress, UserAgent, CreatedAt)
        VALUES (@adminId, @action, @entityType, @entityId, @details, @ip, @ua, GETDATE())
      `, {
        adminId: req.user.userId,
        action: 'USER_ROLE_CHANGED',
        entityType: 'User',
        entityId: userId,
        details: `Role changed from '${previousRole}' to '${role}' for ${user.Email} by admin ${req.user.userId}`,
        ip: req.ip || 'unknown',
        ua: req.headers['user-agent'] || 'unknown'
      });
    } catch (auditErr) {
      logger.warn('Audit log failed for role change (non-fatal):', auditErr.message);
    }

    // Send promotion email if being promoted to voter
    if (role === 'voter' && previousRole !== 'voter') {
      try {
        const { sendVoterPromotionEmail } = require('../services/emailService');
        await sendVoterPromotionEmail({ email: user.Email, firstName: user.FirstName });
      } catch (emailErr) {
        logger.warn('Voter promotion email failed (non-fatal):', emailErr.message);
      }
    }

    logger.info(`User ${userId} role changed from '${previousRole}' to '${role}' by admin ${req.user.userId}`);

    res.json({ success: true, message: `User role updated to '${role}' successfully` });
  })
]);

// @route   POST /api/users/:id/reset-password
// @desc    Admin force-reset a user's password (generates new one + emails user)
// @access  Private (Admin/Super Admin)
router.post('/:id/reset-password', [
  param('id').isInt().withMessage('Valid user ID required'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 chars'),
  validate,
  authorizeRoles('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const sql = require('mssql');
    const { getPool } = require('../config/database');
    const pool = await getPool();

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    // Use provided password or generate one
    const newPassword = req.body.password || (() => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#';
      let pw = 'A1!';
      for (let i = 3; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
      return pw.split('').sort(() => Math.random() - 0.5).join('');
    })();

    await User.changePassword(userId, newPassword);

    // Set RequiresPasswordChange=1 if auto-generated, 0 if admin provided it
    const requiresChange = req.body.password ? 0 : 1;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('req', sql.Bit, requiresChange)
      .query('UPDATE Users SET RequiresPasswordChange=@req, UpdatedAt=GETDATE() WHERE UserID=@userId');

    logger.info(`Password reset for user ${userId} by admin ${req.user.userId}`);
    res.json({
      success: true,
      message: `Password reset successfully for ${user.Email}`,
      newPassword: req.body.password ? undefined : newPassword  // only return if auto-generated
    });
  })
]);

// @route   DELETE /api/users/:id
// @desc    Delete user (Super Admin only)
// @access  Private (Super Admin)
router.delete('/:id', [
  param('id').isInt().withMessage('Valid user ID required'),
  validate,
  authorizeRoles('super_admin'),
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);

    // Cannot delete yourself
    if (userId === req.user.userId) {
      throw new AppError('Cannot delete your own account', 400);
    }

    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Delete user
    await User.delete(userId);

    res.json({
      message: 'User deleted successfully',
      deletedUserId: userId
    });
  })
]);

module.exports = router;
