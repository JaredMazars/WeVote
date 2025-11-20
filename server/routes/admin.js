import express from 'express';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Vote from '../models/Vote.js';
// import auth from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import Resolution from '../models/Resolution.js';


const router = express.Router();

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    // if (req.user.role !== 'admin') {
    //     return res.status(403).json({ 
    //         success: false, 
    //         message: 'Admin access required' 
    //     });
    // }
    // next();
};

let agmTimer = {
  active: false,
  start: '00:30',
  end: '11:00',
  startedAt: null
};

// Start AGM timer
router.post('/agm-timer/start', (req, res) => {
  agmTimer.active = true;
  agmTimer.startedAt = new Date();
  agmTimer.start = req.body.start || '12:00';
  agmTimer.end = req.body.end || '00:00';
  res.json({ success: true, agmTimer });
});

// End AGM timer
router.post('/agm-timer/end', (req, res) => {
  agmTimer.active = false;
  agmTimer.startedAt = null;
  res.json({ success: true, agmTimer });
});

// Get AGM timer status
router.get('/agm-timer/status', (req, res) => {
  res.json({ success: true, agmTimer });
});

router.post('/:id/approve', async (req, res) => {

  try {
    const { id } = req.params;

    const parsedId = parseInt(id, 10);
    if(!parsedId || isNaN(parsedId)) {
      return  res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    const userId = parsedId;
    await User.approveUserById(userId);
    res.json({
      success: true,
      message: 'User approved successfully'
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user'
    });
  }
});


// Get dashboard statistics
router.get('/stats',  requireAdmin, async (req, res) => {
    try {
        const [userStats, voteStats, eventStats, employeeStats] = await Promise.all([
            User.getAll(),
            Vote.getVoteStats(),
            Event.getVotingStats(),
            Employee.getVotingStats()
        ]);

        const recentVotes = await Vote.getRecentVotes(50);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentActivity = recentVotes.filter(vote => 
            new Date(vote.created_at) >= oneWeekAgo
        ).length;

        // Calculate voting trends
        const employeeVoteCount = voteStats.find(stat => stat.vote_type === 'employee')?.total_votes || 0;
        const eventVoteCount = voteStats.find(stat => stat.vote_type === 'event')?.total_votes || 0;

        const stats = {
            totalUsers: userStats.length,
            totalVotes: employeeVoteCount + eventVoteCount,
            totalEvents: eventStats.total_events || 0,
            totalEmployees: employeeStats.total_employees || 0,
            recentActivity,
            votingTrends: {
                employeeVotes: employeeVoteCount,
                eventVotes: eventVoteCount
            }
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch dashboard statistics' 
        });
    }
});

// Get all votes for a user by userId
router.get('/votes/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID required' });
        }
        const votes = await Vote.getVoteStatusByUserId(userId);
        res.json({ success: true, data: votes });
    } catch (error) {
        console.error('Error fetching user votes:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user votes' });
    }
});

// Get all vote logs with detailed information
router.get('/logs',  requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, search, voteType, dateFrom, dateTo } = req.query;
        
        let sql = `
            SELECT v.id, v.vote_type, v.created_at, v.comment, v.is_anonymous,
                   v.ip_address, v.user_agent,
                   voter.name as voter_name, voter.id as voter_id,
                   CASE 
                       WHEN v.vote_type = 'employee' THEN emp_user.name
                       WHEN v.vote_type = 'event' THEN e.title
                   END as target_name,
                   CASE 
                       WHEN v.vote_type = 'employee' THEN v.employee_id
                       WHEN v.vote_type = 'event' THEN v.event_id
                   END as target_id
            FROM votes v
            JOIN users voter ON v.voter_id = voter.id
            LEFT JOIN employees emp ON v.employee_id = emp.id
            LEFT JOIN users emp_user ON emp.user_id = emp_user.id
            LEFT JOIN events e ON v.event_id = e.id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Add search filter
        if (search) {
            sql += ` AND (voter.name LIKE ? OR emp_user.name LIKE ? OR e.title LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        // Add vote type filter
        if (voteType && voteType !== 'all') {
            sql += ` AND v.vote_type = ?`;
            params.push(voteType);
        }
        
        // Add date filters
        if (dateFrom) {
            sql += ` AND DATE(v.created_at) >= ?`;
            params.push(dateFrom);
        }
        
        if (dateTo) {
            sql += ` AND DATE(v.created_at) <= ?`;
            params.push(dateTo);
        }
        
        sql += ` ORDER BY v.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
        
        const db = require('../config/database');
        const logs = await db.query(sql, params);
        
        // Transform data for frontend
        const transformedLogs = logs.map(log => ({
            id: log.id.toString(),
            voterName: log.voter_name,
            voterId: log.voter_id.toString(),
            voteType: log.vote_type,
            targetName: log.target_name,
            targetId: log.target_id?.toString(),
            timestamp: log.created_at,
            ipAddress: log.ip_address,
            userAgent: log.user_agent,
            comment: log.comment,
            isAnonymous: Boolean(log.is_anonymous)
        }));

        res.json({
            success: true,
            data: transformedLogs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: transformedLogs.length
            }
        });

    } catch (error) {
        console.error('Error fetching vote logs:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch vote logs' 
        });
    }
});

// Get all users for admin management


router.get('/users', async (req, res) => {
    try {
        const users = await User.getAll();
        console.log('all for voting', users)
        
        const transformedUsers = users.map(user => ({
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role_name?.toLowerCase() || 'voter',
            avatar: user.avatar_url,
            // isActive: Boolean(user.is_active),
            lastLogin: user.last_login,
            createdAt: user.created_at, 
            updatedAt: user.updated_at,
            active: user.is_active[0],
            goodStandingIdNumber: user.good_standing,
            // Vote weight and limits
            vote_weight: user.vote_weight || 1.0,
            max_votes_allowed: user.max_votes_allowed || 1,
            min_votes_required: user.min_votes_required || 1,
            vote_limit_set_by: user.vote_limit_set_by,
            vote_limit_updated_at: user.vote_limit_updated_at
        }));

        res.json({
            success: true,
            data: transformedUsers
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch users' 
        });
    }
});


// router.post('/users', async (req, res) => {
//   try {
//     const { email, name, password, role_id } = req.body;
    
//     if (!name || !email ||!password) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Name and email required' 
//       });
//     }

//     const userId = await User.create({ email, name, password, role_id});
    
//     res.json({
//       success: true,
//       message: 'User created',
//       data: { userId }
//     });
    
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });


// Update user (admin only)
router.put('/users/:id', [
    body('name').optional().isLength({ min: 2 }).trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['admin', 'voter'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid input data',
                errors: errors.array() 
            });
        }

        const { id } = req.params;
        const { name, avatar, isActive, role } = req.body;

        await User.update(id, {
            name,
            avatar_url: avatar,
            is_active: isActive,
            email_verified: true
        });

        res.json({
            success: true,
            message: 'User updated successfully'
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update user' 
        });
    }
});

// Update user vote weight and limits (admin only - within super admin boundaries)
router.put('/users/:id/vote-limits', async (req, res) => {
    try {
        const { id } = req.params;
        const { vote_weight, max_votes_allowed, min_votes_required } = req.body;

        // Get super admin limits
        const limitsQuery = `
            SELECT min_individual_votes, max_individual_votes 
            FROM vote_splitting_settings 
            WHERE setting_name = 'proxy_vote_splitting'
        `;
        const limitsResult = await User.executeQuery(limitsQuery);
        
        let superAdminLimits = {
            min_individual_votes: 1,
            max_individual_votes: 3
        };

        if (limitsResult && limitsResult.length > 0) {
            superAdminLimits = {
                min_individual_votes: limitsResult[0].min_individual_votes,
                max_individual_votes: limitsResult[0].max_individual_votes
            };
        }

        // Validate against super admin boundaries
        if (vote_weight && (vote_weight < 0.1 || vote_weight > 10)) {
            return res.status(400).json({
                success: false,
                message: 'Vote weight must be between 0.1 and 10'
            });
        }

        if (max_votes_allowed && 
            (max_votes_allowed < superAdminLimits.min_individual_votes || 
             max_votes_allowed > superAdminLimits.max_individual_votes)) {
            return res.status(400).json({
                success: false,
                message: `Max votes must be between ${superAdminLimits.min_individual_votes} and ${superAdminLimits.max_individual_votes} (set by super admin)`
            });
        }

        if (min_votes_required && 
            (min_votes_required < superAdminLimits.min_individual_votes || 
             min_votes_required > (max_votes_allowed || superAdminLimits.max_individual_votes))) {
            return res.status(400).json({
                success: false,
                message: `Min votes must be between ${superAdminLimits.min_individual_votes} and max votes allowed`
            });
        }

        // Get current user (admin) info from token
        const adminId = req.user?.id || 'system';
        const adminEmail = req.user?.email || 'admin';

        // Update user vote limits
        const updateQuery = `
            UPDATE users 
            SET 
                vote_weight = ${vote_weight || 1.0},
                max_votes_allowed = ${max_votes_allowed || 1},
                min_votes_required = ${min_votes_required || 1},
                vote_limit_set_by = '${adminEmail}',
                vote_limit_updated_at = GETDATE()
            WHERE id = ${id}
        `;

        await User.executeQuery(updateQuery);

        res.json({
            success: true,
            message: 'User vote limits updated successfully',
            data: {
                vote_weight: vote_weight || 1.0,
                max_votes_allowed: max_votes_allowed || 1,
                min_votes_required: min_votes_required || 1,
                boundaries: superAdminLimits
            }
        });

    } catch (error) {
        console.error('Error updating user vote limits:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update user vote limits: ' + error.message 
        });
    }
});

// Get user vote limits
router.get('/users/:id/vote-limits', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                id,
                name,
                email,
                vote_weight,
                max_votes_allowed,
                min_votes_required,
                vote_limit_set_by,
                vote_limit_updated_at
            FROM users
            WHERE id = ${id}
        `;

        const result = await User.executeQuery(query);

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = result[0];

        // Also get super admin boundaries
        const limitsQuery = `
            SELECT min_individual_votes, max_individual_votes 
            FROM vote_splitting_settings 
            WHERE setting_name = 'proxy_vote_splitting'
        `;
        const limitsResult = await User.executeQuery(limitsQuery);
        
        const superAdminLimits = limitsResult && limitsResult.length > 0 
            ? {
                min_individual_votes: limitsResult[0].min_individual_votes,
                max_individual_votes: limitsResult[0].max_individual_votes
              }
            : { min_individual_votes: 1, max_individual_votes: 3 };

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    vote_weight: user.vote_weight || 1.0,
                    max_votes_allowed: user.max_votes_allowed || 1,
                    min_votes_required: user.min_votes_required || 1,
                    vote_limit_set_by: user.vote_limit_set_by,
                    vote_limit_updated_at: user.vote_limit_updated_at
                },
                super_admin_boundaries: superAdminLimits
            }
        });

    } catch (error) {
        console.error('Error fetching user vote limits:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch user vote limits' 
        });
    }
});


// // Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await User.softDelete(id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete user' 
        });
    }
});


// Employees
// Get all employees for voting
router.get('/employees',  async (req, res) => {
  try {
    const employees = await Employee.getAllForVoting();

    const transformedEmployees = employees.map(emp => ({
      id: emp.id.toString(),
      name: emp.name,
      position: emp.position,
      department: emp.department,
      avatar: emp.avatar,
      bio: emp.bio,
      achievements: [],
      yearsOfService: emp.years_of_service,
      skills: [],
      votes: emp.total_votes,
      updated_at: emp.updated_at
    }));

    res.json({
      success: true,
      data: transformedEmployees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees'
    });
  }
});

//Add 
router.post('/employees', async (req, res) => {
  try {
    const { name, department, position, bio, email, password_hash } = req.body;
    
    console.log('Received data:', { name, department, position, bio , email, password_hash}); // Debug log
    
    if (!name?.trim() || !department?.trim() || !position?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, department, and position are required' 
      });
    }

    const employeeData = {
      name: name.trim(),
      department: department.trim(),
      position: position.trim(),
      bio: bio?.trim() || null, 
      email: email, 
      password_hash: password_hash
    };

    const employeeId = await Employee.create(employeeData);
    
    res.json({
      success: true,
      message: 'Employee created successfully',
      data: { employeeId }
    });
    
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});


// Update employee (admin only)
router.put('/employees/:id', [
  body('name').optional().isLength({ min: 2 }).trim(),
  body('position').optional().isLength({ min: 1 }).trim(),
  body('department').optional().isLength({ min: 1 }).trim(),
  body('bio').optional().trim(),
  body('yearsOfService').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid input data',
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { name, position, department, avatar, bio, yearsOfService } = req.body;

    await Employee.update(id, {
      name,
      position,
      department,
      avatar,
      bio,
      years_of_service: yearsOfService
    });

    res.json({
      success: true,
      message: 'Employee updated successfully'
    });

  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update employee' 
    });
  }
});


// Delete employee (admin only)
router.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await Employee.delete(id);

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete employee' 
    });
  }
});


//resolution 

router.get('/resolutions', async (req, res) => {
    try {
        const resolutions = await Resolution.getAllForVoting();
        res.json({
            success: true,
            data: resolutions
        });
    } catch (error) {
        console.error('Error fetching resolutions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch resolutions' 
        });
    }
});

router.post('/resolutions', [
    body('title').isLength({ min: 1 }).trim().escape(),
    body('description').isLength({ min: 3 }).trim().escape(),
    body('department').isLength({ min: 1 }).trim(),
    body('voting_start_date').isISO8601(),
    body('voting_end_date').isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            console.log('Request body:', req.body);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid input data',
                errors: errors.array() 
            });
        }

        const { title, description, department, voting_start_date, voting_end_date } = req.body;
        const created_by = 'admin'; // String value for created_by

        console.log('Creating resolution with data:', { title, description, department, voting_start_date, voting_end_date, created_by });

        const resolutionId = await Resolution.create({
            title,
            description,
            department,
            voting_start_date,
            voting_end_date,
            created_by
        });

        res.status(201).json({
            success: true,
            message: 'Resolution created successfully',
            data: { id: resolutionId }
        });

    } catch (error) {
        console.error('Error creating resolution:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to create resolution' 
        });
    }
});



router.put('/resolutions/:id', [
    body('title').optional().isLength({ min: 3 }).trim(),
    body('description').optional().isLength({ min: 10 }).trim(),
    body('department').optional().isLength({ min: 1 }).trim(),
    body('voting_start_date').optional().isISO8601(),
    body('voting_end_date').optional().isISO8601(),
    body('status').optional().isIn(['pending', 'active', 'closed', 'cancelled'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid input data',
                errors: errors.array() 
            });
        }

        const { id } = req.params;
        const { title, description, department, voting_start_date, voting_end_date, status } = req.body;

        await Resolution.update(id, {
            title,
            description,
            department,
            voting_start_date,
            voting_end_date,
            status
        });

        res.json({
            success: true,
            message: 'Resolution updated successfully'
        });

    } catch (error) {
        console.error('Error updating resolution:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update resolution' 
        });
    }
});


router.delete('/resolutions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Deleting resolution ID:', id);

        // Validate ID is a number
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid resolution ID'
            });
        }

        const success = await Resolution.delete(parseInt(id));
        
        if (success) {
            res.json({
                success: true,
                message: 'Resolution deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Resolution not found'
            });
        }

    } catch (error) {
        console.error('Error deleting resolution:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete resolution',
            error: error.message
        });
    }
});

router.get('/votes/logs', async (req, res) => {
  const { search = '', type = 'all' } = req.query;

  try {
    const logs = await Vote.getVoteLogs(search, type);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vote logs' });
  }
});






export default router;
