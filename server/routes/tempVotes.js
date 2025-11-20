import express from 'express';
import TempVote from '../models/TempVote.js';
import auth from '../middleware/auth.js';

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

const router = express.Router();

// Cast a temporary vote
router.post('/cast', auth, async (req, res) => {
  try {
    const { vote_type, target_id, comment } = req.body;

    if (!vote_type || !target_id) {
      return res.status(400).json({
        success: false,
        message: 'Vote type and target ID are required'
      });
    }

    const token = req.headers.authorization?.split(' ')[1];
    const decodedToken = decodeJWT(token);
    const userId = decodedToken?.id || decodedToken?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token'
      });
    }

    const voteData = {
      voter_id: userId,
      vote_type,
      target_id: parseInt(target_id),
      comment: comment || null,
      is_anonymous: 1,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    };

    const tempVoteId = await TempVote.castTempVote(voteData);

    res.json({
      success: true,
      message: 'Temporary vote cast successfully. It will be finalized in 24 hours.',
      tempVoteId,
      canModify: true
    });
  } catch (error) {
    console.error('Error casting temp vote:', error);

    if (error.message.includes('already voted')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to cast temporary vote'
    });
  }
});

// Get user's temporary votes
router.get('/my-votes', auth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decodedToken = decodeJWT(token);
    const userId = decodedToken?.id || decodedToken?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token'
      });
    }

    const tempVotes = await TempVote.getUserTempVotes(userId);

    res.json({
      success: true,
      data: tempVotes
    });
  } catch (error) {
    console.error('Error fetching user temp votes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch temporary votes'
    });
  }
});

// Update a temporary vote (before migration)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const token = req.headers.authorization?.split(' ')[1];
    const decodedToken = decodeJWT(token);
    const userId = decodedToken?.id || decodedToken?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token'
      });
    }

    await TempVote.updateTempVote(parseInt(id), userId, { comment });

    res.json({
      success: true,
      message: 'Temporary vote updated successfully'
    });
  } catch (error) {
    console.error('Error updating temp vote:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update temporary vote'
    });
  }
});

// Delete a temporary vote (before migration)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const token = req.headers.authorization?.split(' ')[1];
    const decodedToken = decodeJWT(token);
    const userId = decodedToken?.id || decodedToken?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token'
      });
    }

    await TempVote.deleteTempVote(parseInt(id), userId);

    res.json({
      success: true,
      message: 'Temporary vote deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting temp vote:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete temporary vote'
    });
  }
});

// Get temp vote statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await TempVote.getTempVoteStats();
    const settings = await TempVote.getVoteSettings();

    res.json({
      success: true,
      data: {
        statistics: stats,
        settings: settings
      }
    });
  } catch (error) {
    console.error('Error fetching temp vote stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Manually trigger migration (admin only)
router.post('/migrate', auth, async (req, res) => {
  try {
    const { batch_size = 100, force_migration = false } = req.body;

    const result = await TempVote.migrateTempVotes(batch_size, force_migration);

    res.json({
      success: true,
      message: 'Migration completed',
      data: result
    });
  } catch (error) {
    console.error('Error migrating temp votes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to migrate temporary votes'
    });
  }
});

// Cleanup old temp votes (admin only)
router.post('/cleanup', auth, async (req, res) => {
  try {
    const { days_to_keep = 7 } = req.body;

    const result = await TempVote.cleanupTempVotes(days_to_keep);

    res.json({
      success: true,
      message: 'Cleanup completed',
      data: result
    });
  } catch (error) {
    console.error('Error cleaning up temp votes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup temporary votes'
    });
  }
});

// Get migration logs (admin only)
router.get('/migration-logs', auth, async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const logs = await TempVote.getMigrationLogs(parseInt(limit));

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching migration logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch migration logs'
    });
  }
});

// Update vote settings (admin only)
router.put('/settings/:settingName', auth, async (req, res) => {
  try {
    const { settingName } = req.params;
    const { settingValue } = req.body;

    const token = req.headers.authorization?.split(' ')[1];
    const decodedToken = decodeJWT(token);
    const updatedBy = decodedToken?.name || 'admin';

    await TempVote.updateVoteSetting(settingName, settingValue, updatedBy);

    res.json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Error updating vote setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting'
    });
  }
});

export default router;