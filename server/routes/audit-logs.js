import express from 'express';
import AuditLog from '../models/AuditLog.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/audit-logs
 * @desc    Get all audit logs with filtering and pagination
 * @access  Public (temporarily for testing)
 */
router.get('/', async (req, res) => {
  try {
    console.log('🚀 [AUDIT-API] Starting audit logs request (NO AUTH)...');
    console.log('📋 [AUDIT-API] Query parameters:', req.query);
    
    // TEMPORARILY REMOVED AUTH CHECK FOR TESTING
    console.log('⚠️ [AUDIT-API] WARNING: Authentication temporarily disabled for testing');

    const {
      page,
      limit,
      user_id,
      action_category,
      action_type,
      status,
      start_date,
      end_date,
      search
    } = req.query;

    const filters = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      user_id,
      action_category,
      action_type,
      status,
      start_date,
      end_date,
      search
    };

    console.log('📊 [AUDIT-API] Applied filters:', filters);

    const result = await AuditLog.getAll(filters);
    
    console.log(`📈 [AUDIT-API] AuditLog.getAll result:`, {
      success: result.success,
      dataLength: result.data?.length || 0,
      pagination: result.pagination
    });

    if (result.success) {
      console.log('✅ [AUDIT-API] Successfully returning audit logs data');
      res.json(result);
    } else {
      console.log('❌ [AUDIT-API] AuditLog.getAll failed:', result);
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('💥 [AUDIT-API] Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audit-logs/stats
 * @desc    Get audit log statistics
 * @access  Admin only
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin (role_id 0 or 1, or role name contains "admin")
    const isAdmin = req.user.role_id === 0 || 
                    req.user.role_id === 1 || 
                    req.user.role === 'admin' || 
                    req.user.role === 'super_admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { start_date, end_date } = req.query;

    const result = await AuditLog.getStats({
      start_date,
      end_date
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audit-logs/user/:userId
 * @desc    Get audit logs for a specific user
 * @access  Admin or the user themselves
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    // Check if user is admin or requesting their own logs
    const isAdmin = req.user.role_id === 0 || 
                    req.user.role_id === 1 || 
                    req.user.role === 'admin' || 
                    req.user.role === 'super_admin';
    
    if (!isAdmin && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const result = await AuditLog.getByUserId(userId, parseInt(limit) || 50);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user audit logs',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audit-logs/entity/:entityType/:entityId
 * @desc    Get audit logs for a specific entity
 * @access  Admin only
 */
router.get('/entity/:entityType/:entityId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin (role_id 0 or 1, or role name contains "admin")
    const isAdmin = req.user.role_id === 0 || 
                    req.user.role_id === 1 || 
                    req.user.role === 'admin' || 
                    req.user.role === 'super_admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { entityType, entityId } = req.params;
    const { limit } = req.query;

    const result = await AuditLog.getByEntity(entityType, entityId, parseInt(limit) || 50);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error fetching entity audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entity audit logs',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/audit-logs/categories
 * @desc    Get list of action categories for filtering
 * @access  Admin only
 */
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or super admin (role_id 0 or 1, or role name contains "admin")
    const isAdmin = req.user.role_id === 0 || 
                    req.user.role_id === 1 || 
                    req.user.role === 'admin' || 
                    req.user.role === 'super_admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const categories = [
      { value: 'AUTH', label: 'Authentication', color: 'blue' },
      { value: 'VOTE', label: 'Voting', color: 'green' },
      { value: 'PROXY', label: 'Proxy Management', color: 'purple' },
      { value: 'ADMIN', label: 'Administration', color: 'red' },
      { value: 'RESOLUTION', label: 'Resolutions', color: 'orange' },
      { value: 'TIMER', label: 'AGM Timer', color: 'yellow' },
      { value: 'SYSTEM', label: 'System', color: 'gray' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

export default router;
