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
    const Resolutions = await Resolution.findatabaseyId(id);
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
router.post('/:id/vote',  async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    // Validate id parameter
    const parsedId = parseInt(id, 10);
    if (!parsedId || isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    
    const userId = 1
    const hasVoted = userId ? await Vote.hasUserVoted(userId, 'event', parsedId) : false;
   
    const voteData = {
      voter_id: 1,
      vote_type: 'event',
      target_id: parseInt(id),
      comment: comment || null,
      is_anonymous: 1,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      hasVoted: hasVoted
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

