import express from 'express';
import Employee from '../models/Employee.js';
import Vote from '../models/Vote.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Defensive middleware for :id
router.param('id', (req, res, next, id) => {
  if (!id || id === ':' || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing employee ID in route'
    });
  }
  next();
});

// IMPORTANT: Specific routes must come before parameterized routes!
// Get employee voting statistics - THIS MUST COME FIRST
router.get('/stats/voting',  async (req, res) => {
  try {
    const stats = await Employee.getVotingStats();
    const topPerformers = await Employee.getTopPerformers(3);

    res.json({
      success: true,
      data: {
        totalEmployees: stats.total_employees,
        totalVotes: stats.total_votes || 0,
        averageVotes: Math.round(stats.avg_votes || 0),
        topPerformers: topPerformers.map(emp => ({
          id: emp.id.toString(),
          name: emp.name,
          position: emp.position,
          department: emp.department,
          avatar: emp.avatar,
          votes: emp.total_votes
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Get all employees for voting
router.get('/',  async (req, res) => {
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
      votes: emp.total_votes
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

// Vote for employee - THIS MUST COME BEFORE /:id route
router.post('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    // Validate id parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    const voteData = {
      voter_id: req.user.userId,
      vote_type: 'employee',
      target_id: parseInt(id),
      comment: comment || null,
      is_anonymous: 1,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    };

    const voteId = await Vote.castVote(voteData);

    res.json({
      success: true,
      message: 'Vote cast successfully',
      voteId
    });
  } catch (error) {
    console.error('Error casting vote:', error);

    if (error.message.includes('already voted')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to cast vote'
    });
  }
});

// Get single employee with details - THIS MUST COME LAST among parameterized routes
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id parameter
    const parsedId = parseInt(id, 10);
    if (!parsedId || isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    const employee = await Employee.findById(parsedId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const [achievements, skills] = await Promise.all([
      Employee.getAchievements(parsedId),
      Employee.getSkills(parsedId)
    ]);

    const userId = req.user?.userId;
    // const hasVoted = userId ? await Vote.hasUserVoted(userId, 'employee', parsedId) : false;

    const transformedEmployee = {
      id: employee.id.toString(),
      name: employee.name,
      position: employee.position,
      department: employee.department,
      avatar: employee.avatar,
      bio: employee.bio,
      achievements: achievements.map(ach => ach.title),
      yearsOfService: employee.years_of_service,
      skills: skills.map(skill => skill.skill_name),
      votes: employee.total_votes,
    //   hasVoted
    };

    res.json({
      success: true,
      data: transformedEmployee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee details'
    });
  }
});


export default router;