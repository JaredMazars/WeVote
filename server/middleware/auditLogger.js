import AuditLog from '../models/AuditLog.js';

/**
 * Audit Logger Middleware and Utilities
 * Provides helper functions to log various actions throughout the app
 */

/**
 * Extract IP address from request
 */
const getIpAddress = (req) => {
  return req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         'unknown';
};

/**
 * Extract user agent from request
 */
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

/**
 * Main audit logging function
 */
const logAudit = async ({
  req,
  user_id,
  action_type,
  action_category,
  description,
  entity_type = null,
  entity_id = null,
  metadata = {},
  status = 'success'
}) => {
  try {
    const logData = {
      user_id: user_id || req?.user?.id || req?.user?.userId || null,
      action_type,
      action_category,
      description,
      entity_type,
      entity_id,
      metadata,
      ip_address: req ? getIpAddress(req) : null,
      user_agent: req ? getUserAgent(req) : null,
      status
    };

    await AuditLog.create(logData);
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - logging failures shouldn't break the app
  }
};

/**
 * AUTH ACTIONS
 */
const logLogin = async (req, userId, userName, success = true) => {
  await logAudit({
    req,
    user_id: userId,
    action_type: success ? 'login' : 'failed_login',
    action_category: 'AUTH',
    description: success 
      ? `User ${userName} logged in successfully`
      : `Failed login attempt for ${userName}`,
    entity_type: 'user',
    entity_id: userId,
    metadata: { 
      success,
      timestamp: new Date().toISOString()
    },
    status: success ? 'success' : 'failure'
  });
};

const logLogout = async (req, userId, userName) => {
  await logAudit({
    req,
    user_id: userId,
    action_type: 'logout',
    action_category: 'AUTH',
    description: `User ${userName} logged out`,
    entity_type: 'user',
    entity_id: userId,
    metadata: { timestamp: new Date().toISOString() }
  });
};

const logPasswordChange = async (req, userId, userName, isFirstLogin = false) => {
  await logAudit({
    req,
    user_id: userId,
    action_type: 'password_change',
    action_category: 'AUTH',
    description: isFirstLogin 
      ? `User ${userName} changed password on first login`
      : `User ${userName} changed their password`,
    entity_type: 'user',
    entity_id: userId,
    metadata: { isFirstLogin, timestamp: new Date().toISOString() }
  });
};

const logForgotPassword = async (req, email, success = true) => {
  await logAudit({
    req,
    user_id: null,
    action_type: 'forgot_password',
    action_category: 'AUTH',
    description: success
      ? `Password reset requested for ${email}`
      : `Failed password reset attempt for ${email}`,
    metadata: { email, success, timestamp: new Date().toISOString() },
    status: success ? 'success' : 'failure'
  });
};

/**
 * VOTE ACTIONS
 */
const logVoteCast = async (req, userId, userName, employeeId, employeeName, isProxy = false) => {
  await logAudit({
    req,
    user_id: userId,
    action_type: isProxy ? 'proxy_vote_cast' : 'vote_cast',
    action_category: 'VOTE',
    description: isProxy
      ? `${userName} cast a proxy vote for employee ${employeeName}`
      : `${userName} voted for employee ${employeeName}`,
    entity_type: 'employee',
    entity_id: employeeId,
    metadata: {
      employee_name: employeeName,
      is_proxy: isProxy,
      timestamp: new Date().toISOString()
    }
  });
};

const logVoteRemoved = async (req, userId, userName, employeeId, employeeName, voteCount = 1) => {
  await logAudit({
    req,
    user_id: userId,
    action_type: 'vote_removed',
    action_category: 'VOTE',
    description: `${userName} removed ${voteCount} vote(s) for employee ${employeeName}`,
    entity_type: 'employee',
    entity_id: employeeId,
    metadata: {
      employee_name: employeeName,
      vote_count: voteCount,
      timestamp: new Date().toISOString()
    }
  });
};

const logVoteEdited = async (req, userId, userName, employeeId, employeeName, changes) => {
  await logAudit({
    req,
    user_id: userId,
    action_type: 'vote_edited',
    action_category: 'VOTE',
    description: `${userName} edited their vote for employee ${employeeName}`,
    entity_type: 'employee',
    entity_id: employeeId,
    metadata: {
      employee_name: employeeName,
      changes,
      timestamp: new Date().toISOString()
    }
  });
};

const logSplitVoteCast = async (req, userId, userName, employeeId, employeeName, delegatorCount) => {
  await logAudit({
    req,
    user_id: userId,
    action_type: 'split_vote_cast',
    action_category: 'VOTE',
    description: `${userName} cast split votes for ${delegatorCount} delegators on employee ${employeeName}`,
    entity_type: 'employee',
    entity_id: employeeId,
    metadata: {
      employee_name: employeeName,
      delegator_count: delegatorCount,
      timestamp: new Date().toISOString()
    }
  });
};

const logResolutionVote = async (req, userId, userName, resolutionId, resolutionTitle, voteValue) => {
  await logAudit({
    req,
    user_id: userId,
    action_type: 'resolution_vote_cast',
    action_category: 'VOTE',
    description: `${userName} voted ${voteValue} on resolution: ${resolutionTitle}`,
    entity_type: 'resolution',
    entity_id: resolutionId,
    metadata: {
      resolution_title: resolutionTitle,
      vote_value: voteValue,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * PROXY ACTIONS
 */
const logProxyAssigned = async (req, proxyId, proxyName, delegatorId, delegatorName, voteType) => {
  await logAudit({
    req,
    user_id: proxyId,
    action_type: 'proxy_assigned',
    action_category: 'PROXY',
    description: `${delegatorName} assigned proxy voting rights to ${proxyName} for ${voteType}`,
    entity_type: 'proxy',
    entity_id: proxyId,
    metadata: {
      delegator_id: delegatorId,
      delegator_name: delegatorName,
      vote_type: voteType,
      timestamp: new Date().toISOString()
    }
  });
};

const logProxyRevoked = async (req, proxyId, proxyName, delegatorId, delegatorName) => {
  await logAudit({
    req,
    user_id: proxyId,
    action_type: 'proxy_revoked',
    action_category: 'PROXY',
    description: `${delegatorName} revoked proxy voting rights from ${proxyName}`,
    entity_type: 'proxy',
    entity_id: proxyId,
    metadata: {
      delegator_id: delegatorId,
      delegator_name: delegatorName,
      timestamp: new Date().toISOString()
    }
  });
};

const logProxyGroupCreated = async (req, userId, userName, groupId, memberCount) => {
  await logAudit({
    req,
    user_id: userId,
    action_type: 'proxy_group_created',
    action_category: 'PROXY',
    description: `${userName} created a proxy group with ${memberCount} members`,
    entity_type: 'proxy_group',
    entity_id: groupId,
    metadata: {
      member_count: memberCount,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * ADMIN ACTIONS
 */
const logUserCreated = async (req, adminId, adminName, newUserId, newUserName, newUserEmail) => {
  await logAudit({
    req,
    user_id: adminId,
    action_type: 'user_created',
    action_category: 'ADMIN',
    description: `Admin ${adminName} created new user: ${newUserName} (${newUserEmail})`,
    entity_type: 'user',
    entity_id: newUserId,
    metadata: {
      new_user_name: newUserName,
      new_user_email: newUserEmail,
      timestamp: new Date().toISOString()
    }
  });
};

const logUserUpdated = async (req, adminId, adminName, userId, userName, changes) => {
  await logAudit({
    req,
    user_id: adminId,
    action_type: 'user_updated',
    action_category: 'ADMIN',
    description: `Admin ${adminName} updated user: ${userName}`,
    entity_type: 'user',
    entity_id: userId,
    metadata: {
      user_name: userName,
      changes,
      timestamp: new Date().toISOString()
    }
  });
};

const logUserStatusChanged = async (req, adminId, adminName, userId, userName, isActive, reason = null) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'Unknown';
  
  const status = isActive ? 'activated' : 'deactivated';
  const description = `Admin ${adminName} ${status} user ${userName} (ID: ${userId})${reason ? ` - Reason: ${reason}` : ''}`;
  
  const metadata = JSON.stringify({
    admin_id: adminId,
    admin_name: adminName,
    user_id: userId,
    user_name: userName,
    is_active: isActive,
    previous_status: !isActive,
    reason: reason
  });

  try {
    await AuditLog.create({
      user_id: adminId.toString(),
      action_type: isActive ? 'user_activated' : 'user_deactivated',
      action_category: 'ADMIN',
      description,
      entity_type: 'user',
      entity_id: userId.toString(),
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: 'success'
    });
    console.log(`✅ Logged user status change: ${status} - ${userName}`);
  } catch (error) {
    console.error('❌ Failed to log user status change:', error);
  }
};

const logUserDeleted = async (req, adminId, adminName, userId, userName) => {
  await logAudit({
    req,
    user_id: adminId,
    action_type: 'user_deleted',
    action_category: 'ADMIN',
    description: `Admin ${adminName} deleted user: ${userName}`,
    entity_type: 'user',
    entity_id: userId,
    metadata: {
      deleted_user_name: userName,
      timestamp: new Date().toISOString()
    }
  });
};

const logEmployeeCreated = async (req, adminId, adminName, employeeId, employeeName) => {
  await logAudit({
    req,
    user_id: adminId,
    action_type: 'employee_created',
    action_category: 'ADMIN',
    description: `Admin ${adminName} created new employee: ${employeeName}`,
    entity_type: 'employee',
    entity_id: employeeId,
    metadata: {
      employee_name: employeeName,
      timestamp: new Date().toISOString()
    }
  });
};

const logEmployeeUpdated = async (req, adminId, adminName, employeeId, employeeName, changes) => {
  await logAudit({
    req,
    user_id: adminId,
    action_type: 'employee_updated',
    action_category: 'ADMIN',
    description: `Admin ${adminName} updated employee: ${employeeName}`,
    entity_type: 'employee',
    entity_id: employeeId,
    metadata: {
      employee_name: employeeName,
      changes,
      timestamp: new Date().toISOString()
    }
  });
};

const logEmployeeDeleted = async (req, adminId, adminName, employeeId, employeeName) => {
  await logAudit({
    req,
    user_id: adminId,
    action_type: 'employee_deleted',
    action_category: 'ADMIN',
    description: `Admin ${adminName} deleted employee: ${employeeName}`,
    entity_type: 'employee',
    entity_id: employeeId,
    metadata: {
      deleted_employee_name: employeeName,
      timestamp: new Date().toISOString()
    }
  });
};

const logResolutionCreated = async (req, adminId, adminName, resolutionId, resolutionTitle) => {
  await logAudit({
    req,
    user_id: adminId,
    action_type: 'resolution_created',
    action_category: 'ADMIN',
    description: `Admin ${adminName} created new resolution: ${resolutionTitle}`,
    entity_type: 'resolution',
    entity_id: resolutionId,
    metadata: {
      resolution_title: resolutionTitle,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * TIMER ACTIONS
 */
const logTimerStarted = async (req, adminId, adminName, startTime, endTime) => {
  await logAudit({
    req,
    user_id: adminId,
    action_type: 'agm_timer_started',
    action_category: 'TIMER',
    description: `Admin ${adminName} started AGM timer (${startTime} - ${endTime})`,
    metadata: {
      start_time: startTime,
      end_time: endTime,
      timestamp: new Date().toISOString()
    }
  });
};

const logTimerStopped = async (req, adminId, adminName) => {
  await logAudit({
    req,
    user_id: adminId,
    action_type: 'agm_timer_stopped',
    action_category: 'TIMER',
    description: `Admin ${adminName} stopped AGM timer`,
    metadata: {
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * SYSTEM ACTIONS
 */
const logDataExport = async (req, userId, userName, exportType, recordCount) => {
  await logAudit({
    req,
    user_id: userId,
    action_type: 'data_export',
    action_category: 'SYSTEM',
    description: `${userName} exported ${exportType} data (${recordCount} records)`,
    metadata: {
      export_type: exportType,
      record_count: recordCount,
      timestamp: new Date().toISOString()
    }
  });
};

const logBulkAction = async (req, userId, userName, actionType, affectedCount) => {
  await logAudit({
    req,
    user_id: userId,
    action_type: 'bulk_action',
    action_category: 'SYSTEM',
    description: `${userName} performed bulk ${actionType} on ${affectedCount} items`,
    metadata: {
      action_type: actionType,
      affected_count: affectedCount,
      timestamp: new Date().toISOString()
    }
  });
};

export {
  logAudit,
  // Auth
  logLogin,
  logLogout,
  logPasswordChange,
  logForgotPassword,
  // Voting
  logVoteCast,
  logVoteRemoved,
  logVoteEdited,
  logSplitVoteCast,
  logResolutionVote,
  // Proxy
  logProxyAssigned,
  logProxyRevoked,
  logProxyGroupCreated,
  // Admin
  logUserCreated,
  logUserUpdated,
  logUserStatusChanged,
  logUserDeleted,
  logEmployeeCreated,
  logEmployeeUpdated,
  logEmployeeDeleted,
  logResolutionCreated,
  // Timer
  logTimerStarted,
  logTimerStopped,
  // System
  logDataExport,
  logBulkAction
};
