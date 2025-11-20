import express from 'express';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import database from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/users/:id/approve
 * @desc    Approve user by ID
 */
router.get('/users/:id/approve', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const userResult = await database.query(
      `SELECT email, name FROM users WHERE id = ${userId}`
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { email, name } = userResult[0];

    // Generate a secure random password
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    console.log('🔐 Generated password for user:', password);

    await User.approveUserById(userId, password);

    const emailResult = await emailService.sendWelcomeEmail(email, name, password);
      if (emailResult.success) {
        console.log('✅ Welcome email sent successfully');
      } else {
        console.error(' Failed to send welcome email:', emailResult.error);
      }

    return res.status(200).json({
      success: true,
      message: 'User approved successfully'
    });
  } catch (error) {
    console.error('Error approving user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve user'
    });
  }
});

/**
 * @route   GET /api/users/:id/approve-good-standing
 * @desc    Approve user for good standing
 */
router.get('/users/:id/approve-good-standing', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const approvedUser = await User.approveUserGoodStandingById(userId);

    // if (!approvedUser || !approvedUser.is_active) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'User could not be approved or is not active'
    //   });
    // }

    const { email, name } = approvedUser;

    if (email && name) {
      const emailResult = await emailService.sendApproveGoodStandingEmail(email, name);
      if (emailResult.success) {
        console.log('✅ Approval email sent successfully');
      } else {
        console.error('❌ Failed to send approval email:', emailResult.error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'User approved for good standing successfully'
    });

  } catch (error) {
    console.error('Error approving user for good standing:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve user for good standing'
    });
  }
});


// POST /api/approval/users/bulk-approve
// POST /api/approval/users/bulk-approve
router.post('/users/bulk-approve', async (req, res) => {
  const { users } = req.body;

  if (!users || !Array.isArray(users) || users.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid users array'
    });
  }

  try {
    let updatedCount = 0;

    for (const userData of users) {
      const { email, valid, goodStanding } = userData;

      // Build dynamic SET clause - ONLY if the value is TRUE
      const updates = [];
      const params = [];

      // ONLY set is_active = 1 if valid is TRUE
      if (valid === true) {
        updates.push('is_active = ?');
        params.push(1);
      }

      // ONLY set good_standing = 1 if goodStanding is TRUE
      if (goodStanding === true) {
        updates.push('good_standing = ?');
        params.push(1);
      }

      // If at least one field needs updating
      if (updates.length > 0) {
        // Always update reviewed_at when making changes
        updates.push('reviewed_at = NOW()');
        
        // Add email to params for WHERE clause
        params.push(email);

        const query = `
          UPDATE users 
          SET ${updates.join(', ')}
          WHERE email = ?
        `;

        const [result] = await db.execute(query, params);
        updatedCount += result.affectedRows;
      }
    }

    res.json({
      success: true,
      updatedCount,
      message: `Successfully processed ${updatedCount} users`
    });
  } catch (error) {
    console.error('Bulk approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk approve users'
    });
  }
});



export default router;
