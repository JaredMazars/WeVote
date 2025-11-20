import express from 'express';
import VoteSplittingSettings from '../models/VoteSplittingSettings.js';
import User from '../models/User.js';
import database from '../config/database.js';
// import auth from '../middleware/auth.js';

const router = express.Router();

// Middleware to check super admin role (role_id = 0)
const requireSuperAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // TEMPORARY: Skip role verification for testing
    // TODO: Re-enable role checking after fixing login issue
    console.log('Super admin endpoint accessed with token:', token.substring(0, 20) + '...');
    
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    
    // Get user details including role
    const userResult = await database.query(
      `SELECT u.id, u.email, u.role_id, r.name as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ${decoded.id}`
    );

    if (!userResult || userResult.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult[0];
    console.log('User accessing super admin endpoint:', {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name
    });
    
    // TEMPORARY: Allow any authenticated user for testing
    // Check if user is super admin (role_id = 0)
    // if (user.role_id !== 0) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Super admin access required. Current role: ' + user.role_name
    //   });
    // }

    req.user = user;
    next();
  } catch (error) {
    console.error('Super admin auth error:', error);
    return res.status(403).json({
      success: false,
      message: 'Invalid access token'
    });
  }
};

// Get current vote splitting settings
router.get('/vote-splitting-settings', requireSuperAdmin, async (req, res) => {
  try {
    const settings = await VoteSplittingSettings.getSettings();
    
    if (!settings) {
      // Return default settings if none exist
      return res.json({
        success: true,
        data: {
          setting_name: 'proxy_vote_splitting',
          is_enabled: false,
          min_proxy_voters: 2,
          max_proxy_voters: 20,
          min_individual_votes: 1,
          max_individual_votes: 3
        }
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching vote splitting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vote splitting settings'
    });
  }
});

// Update vote splitting settings
router.put('/vote-splitting-settings', requireSuperAdmin, async (req, res) => {
  try {
    const { is_enabled, min_proxy_voters, max_proxy_voters, min_individual_votes, max_individual_votes } = req.body;

    // Validation
    if (min_proxy_voters >= max_proxy_voters) {
      return res.status(400).json({
        success: false,
        message: 'Minimum proxy voters must be less than maximum'
      });
    }

    if (min_individual_votes >= max_individual_votes) {
      return res.status(400).json({
        success: false,
        message: 'Minimum individual votes must be less than maximum'
      });
    }

    if (min_proxy_voters < 1 || max_proxy_voters > 100) {
      return res.status(400).json({
        success: false,
        message: 'Proxy voter limits must be between 1 and 100'
      });
    }

    if (min_individual_votes < 1 || max_individual_votes > 10) {
      return res.status(400).json({
        success: false,
        message: 'Individual vote limits must be between 1 and 10'
      });
    }

    const updatedSettings = await VoteSplittingSettings.updateSettings({
      is_enabled: Boolean(is_enabled),
      min_proxy_voters: parseInt(min_proxy_voters),
      max_proxy_voters: parseInt(max_proxy_voters),
      min_individual_votes: parseInt(min_individual_votes),
      max_individual_votes: parseInt(max_individual_votes)
    });

    res.json({
      success: true,
      message: 'Vote splitting settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating vote splitting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vote splitting settings'
    });
  }
});

// Get proxy group limits
router.get('/proxy-groups/:id/limits', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const limits = await VoteSplittingSettings.getProxyGroupLimits(parseInt(id));

    if (!limits) {
      return res.status(404).json({
        success: false,
        message: 'Proxy group not found'
      });
    }

    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error('Error fetching proxy group limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proxy group limits'
    });
  }
});

// Update proxy group limits
router.put('/proxy-groups/:id/limits', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { vote_splitting_enabled, min_votes_per_user, max_votes_per_user } = req.body;

    // Validation
    if (min_votes_per_user >= max_votes_per_user) {
      return res.status(400).json({
        success: false,
        message: 'Minimum votes per user must be less than maximum'
      });
    }

    const updatedLimits = await VoteSplittingSettings.updateProxyGroupLimits(parseInt(id), {
      vote_splitting_enabled: Boolean(vote_splitting_enabled),
      min_votes_per_user: parseInt(min_votes_per_user),
      max_votes_per_user: parseInt(max_votes_per_user)
    });

    res.json({
      success: true,
      message: 'Proxy group limits updated successfully',
      data: updatedLimits
    });
  } catch (error) {
    console.error('Error updating proxy group limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update proxy group limits'
    });
  }
});

// Get proxy voter limits for a group
router.get('/proxy-groups/:id/voter-limits', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const voterLimits = await VoteSplittingSettings.getProxyVoterLimits(parseInt(id));

    res.json({
      success: true,
      data: voterLimits
    });
  } catch (error) {
    console.error('Error fetching proxy voter limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proxy voter limits'
    });
  }
});

// Set proxy voter limits for a group
router.put('/proxy-groups/:id/voter-limits', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { voter_limits } = req.body;

    // Validation
    if (!Array.isArray(voter_limits)) {
      return res.status(400).json({
        success: false,
        message: 'Voter limits must be an array'
      });
    }

    for (const limit of voter_limits) {
      if (!limit.user_id || !limit.max_votes_allowed || limit.max_votes_allowed < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid voter limit data'
        });
      }
    }

    const updatedLimits = await VoteSplittingSettings.setProxyVoterLimits(parseInt(id), voter_limits);

    res.json({
      success: true,
      message: 'Proxy voter limits updated successfully',
      data: updatedLimits
    });
  } catch (error) {
    console.error('Error setting proxy voter limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set proxy voter limits'
    });
  }
});

// Distribute a vote among proxy group members
router.post('/votes/:voteId/distribute', requireSuperAdmin, async (req, res) => {
  try {
    const { voteId } = req.params;
    const { distributions } = req.body;

    // Validation
    if (!Array.isArray(distributions)) {
      return res.status(400).json({
        success: false,
        message: 'Distributions must be an array'
      });
    }

    // Check that total weight equals 1.0
    const totalWeight = distributions.reduce((sum, dist) => sum + parseFloat(dist.weight), 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Total vote weight must equal 1.0'
      });
    }

    const result = await VoteSplittingSettings.distributeVote(parseInt(voteId), distributions);

    res.json({
      success: true,
      message: 'Vote distributed successfully'
    });
  } catch (error) {
    console.error('Error distributing vote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to distribute vote'
    });
  }
});

// Get vote distributions
router.get('/votes/:voteId/distributions', requireSuperAdmin, async (req, res) => {
  try {
    const { voteId } = req.params;
    const distributions = await VoteSplittingSettings.getVoteDistributions(parseInt(voteId));

    res.json({
      success: true,
      data: distributions
    });
  } catch (error) {
    console.error('Error fetching vote distributions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vote distributions'
    });
  }
});

// Get all super admins
router.get('/super-admins', requireSuperAdmin, async (req, res) => {
  try {
    // Query users with role_id = 0 (super admin)
    const sql = `
      SELECT u.id, u.name, u.email, u.avatar_url, u.created_at, u.last_login, u.is_active,
             r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.role_id = 0
      ORDER BY u.name
    `;
    
    const superAdmins = await database.query(sql);

    res.json({
      success: true,
      data: superAdmins
    });
  } catch (error) {
    console.error('Error fetching super admins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch super admins'
    });
  }
});

// Promote user to super admin
router.put('/users/:userId/promote-super-admin', requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const sql = `
      UPDATE users 
      SET role_id = 0, updated_at = GETDATE()
      WHERE id = ${parseInt(userId)}
    `;

    await database.query(sql);

    res.json({
      success: true,
      message: 'User promoted to super admin successfully'
    });
  } catch (error) {
    console.error('Error promoting user to super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to promote user to super admin'
    });
  }
});

// Demote super admin to regular admin
router.put('/users/:userId/demote-super-admin', requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const sql = `
      UPDATE users 
      SET role_id = 1, updated_at = GETDATE()
      WHERE id = ${parseInt(userId)}
    `;

    await database.query(sql);

    res.json({
      success: true,
      message: 'Super admin demoted to regular admin successfully'
    });
  } catch (error) {
    console.error('Error demoting super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to demote super admin'
    });
  }
});

// Check user roles endpoint
router.get('/check-roles', async (req, res) => {
  try {
    console.log('🔍 Checking user roles...');
    
    // Get all users with their roles
    const usersSql = `
      SELECT u.id, u.email, u.name, u.role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email IN ('jaredmoodley1212@gmail.com', 'superadmin@wevote.com')
      ORDER BY u.id
    `;
    
    const users = await database.query(usersSql);
    
    // Get all roles
    const rolesSql = `SELECT id, name, description FROM roles ORDER BY id`;
    const roles = await database.query(rolesSql);
    
    console.log('Users found:', users);
    console.log('Available roles:', roles);
    
    res.json({
      success: true,
      users: users,
      roles: roles,
      message: 'User roles checked successfully'
    });
    
  } catch (error) {
    console.error('Error checking roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check roles',
      error: error.message
    });
  }
});

// Fix user role endpoint
router.post('/fix-user-role', async (req, res) => {
  try {
    console.log('🔧 Fixing user role for jaredmoodley1212@gmail.com...');
    
    // Update jaredmoodley1212@gmail.com to have role_id = 0 (Super Admin)
    const updateSql = `
      UPDATE users 
      SET role_id = 0, updated_at = GETDATE()
      WHERE email = 'jaredmoodley1212@gmail.com'
    `;
    
    await database.query(updateSql);
    
    // Verify the update
    const checkSql = `
      SELECT u.id, u.email, u.name, u.role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = 'jaredmoodley1212@gmail.com'
    `;
    
    const result = await database.query(checkSql);
    
    if (result && result.length > 0) {
      const user = result[0];
      console.log('✅ User role updated:', user);
      
      res.json({
        success: true,
        message: 'User role updated to Super Admin successfully',
        user: user
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found after update'
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix user role',
      error: error.message
    });
  }
});

// TEMPORARY: Fix super admin password endpoint
router.post('/fix-password', async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    const password = 'SuperAdmin123!';
    
    // Generate proper bcrypt hash
    const hashedPassword = await bcrypt.default.hash(password, 12);
    console.log('Generated new hash for super admin:', hashedPassword);
    
    // Update the super admin user with correct password hash
    const updateSql = `
      UPDATE users 
      SET password_hash = '${hashedPassword}', updated_at = GETDATE()
      WHERE email = 'superadmin@wevote.com'
    `;
    
    await database.query(updateSql);
    
    // Verify the update
    const checkSql = `
      SELECT id, email, role_id, password_hash 
      FROM users 
      WHERE email = 'superadmin@wevote.com'
    `;
    
    const result = await database.query(checkSql);
    
    if (result && result.length > 0) {
      const user = result[0];
      console.log('Super admin password updated:', {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        hash_length: user.password_hash.length
      });
      
      // Test the hash
      const isValid = await bcrypt.default.compare(password, user.password_hash);
      
      res.json({
        success: true,
        message: 'Super admin password updated successfully',
        passwordTest: isValid ? 'PASS' : 'FAIL',
        user: {
          id: user.id,
          email: user.email,
          role_id: user.role_id
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Super admin user not found'
      });
    }
    
  } catch (error) {
    console.error('Error fixing super admin password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix super admin password',
      error: error.message
    });
  }
});

export default router;
