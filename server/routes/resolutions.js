import express from 'express';
import Resolution from '../models/Resolution.js';
import Vote from '../models/Vote.js';
// import auth from '../middleware/auth.js';

const router = express.Router();

// Defensive middleware for :id
router.param('id', (req, res, next, id) => {
  if (!id || id === ':' || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing resolution ID in route'
    });
  }
  next();
});

// Get all events for voting
router.get('/',  async (req, res) => {
  try {
    const events = await Resolution.getAllForVoting();

    const transformedEvents = events.map(Resolution => ({
      id: Resolution.id.toString(),
      title: Resolution.title,
      description: Resolution.description,
      date: Resolution.event_date,
      location: Resolution.location,
      image: Resolution.image_url,
      organizer: Resolution.organizer,
      category: Resolution.category,
      votes: Resolution.total_votes,
      details: ''
    }));

    res.json({
      success: true,
      data: transformedEvents
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
});

// Get single Resolution with details
router.get('/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    const Resolutions = await Resolution.findById(id);
    console.log('Fetched Resolution:', Resolutions);

    if (!Resolutions) {
      return res.status(404).json({
        success: false,
        message: 'Resolution not found'
      });
    }

    const userId = 1
    const hasVoted = await Vote.hasUserVoted(userId, 'event', id);

    const transformedEvent = {
        id: Resolutions.id,
        title: Resolutions.title,
        description: Resolutions.description,
        date: Resolutions.event_date,
        location: Resolutions.location,
        image: Resolutions.image_url,
        organizer: Resolutions.organizer,
        category: Resolutions.category,
        votes: Resolutions.total_votes,
        details: Resolutions.details || Resolutions.description,
        hasVoted
      };
      
      res.json({
        success: true,
        data: transformedEvent
      });
    } catch (error) {
    console.error('Error fetching Resolution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Resolution details'
    });
  }
});



// Vote for Resolution
router.post('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, vote_choice } = req.body; // NEW: accept vote_choice

    // Validate id parameter
    const parsedId = parseInt(id, 10);
    if (!parsedId || isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resolution ID'
      });
    }

    // Validate vote_choice
    if (!vote_choice || !['YES', 'NO', 'ABSTAIN'].includes(vote_choice)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote choice. Must be YES, NO, or ABSTAIN'
      });
    }

    const userId = 1; // TODO: Get from authentication
    
    // Check if user has already voted
    const hasVoted = await Vote.hasUserVoted(userId, 'resolution', parsedId);
    
    if (hasVoted) {
      return res.status(409).json({
        success: false,
        message: 'You have already voted for this resolution'
      });
    }

    const voteData = {
      voter_id: userId,
      vote_type: 'resolution',
      target_id: parsedId,
      vote_choice: vote_choice, // NEW
      comment: comment || null,
      is_anonymous: true,
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
      message: 'Failed to cast vote',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


router.get('/:resolutionId/votes', async (req, res) => {
  try {
    const { resolutionId } = req.params;
    
    if (!resolutionId) {
      return res.status(400).json({
        success: false,
        message: 'Resolution ID is required'
      });
    }

    const voteStatus = await Resolution.getVoteStatusByResolutionId(resolutionId);
    
    res.json(voteStatus);

  } catch (error) {
    console.error('Resolution vote status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while checking resolution vote status',
      data: {
        totalVotes: 0,
        totalVoteCount: 0,
        voters: []
      }
    });
  }
});


// Get Resolution categories
router.get('/categories/all',  async (req, res) => {
  try {
    const categories = await Resolution.getCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Get Resolution voting statistics
router.get('/stats/voting',  async (req, res) => {
  try {
    const stats = await Resolution.getVotingStats();
    const featured = await Resolution.getFeatured(3);

    res.json({
      success: true,
      data: {
        totalEvents: stats.total_events,
        totalVotes: stats.total_votes || 0,
        averageVotes: Math.round(stats.avg_votes || 0),
        featuredEvents: featured.map(Resolution => ({
          id: Resolution.id.toString(),
          title: Resolution.title,
          description: Resolution.description,
          date: Resolution.event_date,
          location: Resolution.location,
          image: Resolution.image_url,
          category: Resolution.category,
          votes: Resolution.total_votes
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching Resolution stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

export default router;

