import express from 'express';
import database from '../config/database.js';

const router = express.Router();

// Get voting status for a user
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    console.log('Fetching voting status for user:', userIdInt); // Debug log

    // Get user's vote weight and limits - use ISNULL for columns that might not exist
    const userQuery = `
      SELECT 
        id,
        name,
        email,
        ISNULL(vote_weight, 1.0) as vote_weight,
        ISNULL(max_votes_allowed, 1) as max_votes_allowed,
        ISNULL(min_votes_required, 1) as min_votes_required
      FROM users
      WHERE id = ${userIdInt}
    `;
    
    const users = await database.query(userQuery);
    
    console.log('User query result:', users); // Debug log
    
    if (!users || users.length === 0) {
      console.log('User not found:', userIdInt);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Get user's personal votes cast
    const personalVotesQuery = `
      SELECT 
        v.id,
        v.vote_type,
        v.employee_id,
        v.resolution_id,
        v.vote_choice,
        v.comment,
        v.is_anonymous,
        v.created_at,
        ISNULL(v.vote_weight, 1.0) as vote_weight,
        CASE 
          WHEN v.vote_type = 'employee' THEN u_emp.name
          WHEN v.vote_type = 'resolution' THEN r.title
          ELSE NULL
        END as target_name,
        CASE 
          WHEN v.vote_type = 'employee' THEN e.position
          ELSE NULL
        END as target_position,
        CASE 
          WHEN v.vote_type = 'employee' THEN d.name
          ELSE NULL
        END as target_department
      FROM votes v
      LEFT JOIN employees e ON v.employee_id = e.id
      LEFT JOIN users u_emp ON e.user_id = u_emp.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN resolutions r ON v.resolution_id = r.id
      WHERE v.voter_id = ${userIdInt}
        AND (v.proxy_id IS NULL OR v.proxy_id = 0)
      ORDER BY v.created_at DESC
    `;

    console.log('Fetching personal votes...'); // Debug log
    const personalVotes = await database.query(personalVotesQuery);

    console.log('Personal votes count:', personalVotes?.length || 0); // Debug log

    // Get proxy votes cast by this user
    const proxyVotesQuery = `
      SELECT 
        v.id,
        v.vote_type,
        v.employee_id,
        v.resolution_id,
        v.vote_choice,
        v.comment,
        v.is_anonymous,
        v.created_at,
        ISNULL(v.vote_weight, 1.0) as vote_weight,
        v.proxy_id,
        CASE 
          WHEN v.vote_type = 'employee' THEN u_emp.name
          WHEN v.vote_type = 'resolution' THEN r.title
          ELSE NULL
        END as target_name,
        CASE 
          WHEN v.vote_type = 'employee' THEN e.position
          ELSE NULL
        END as target_position,
        CASE 
          WHEN v.vote_type = 'employee' THEN d.name
          ELSE NULL
        END as target_department,
        delegator.id as delegator_id,
        delegator.name as delegator_name,
        delegator.email as delegator_email
      FROM votes v
      LEFT JOIN employees e ON v.employee_id = e.id
      LEFT JOIN users u_emp ON e.user_id = u_emp.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN resolutions r ON v.resolution_id = r.id
      LEFT JOIN proxy_groups pg ON v.proxy_id = pg.id
      LEFT JOIN users delegator ON pg.principal_id = delegator.id
      WHERE v.voter_id = ${userIdInt}
        AND v.proxy_id IS NOT NULL AND v.proxy_id > 0
      ORDER BY v.created_at DESC
    `;

    console.log('Fetching proxy votes...'); // Debug log
    const proxyVotes = await database.query(proxyVotesQuery);

    console.log('Proxy votes count:', proxyVotes?.length || 0); // Debug log

    // Get proxy delegations TO this user (where this user votes on behalf of others)
    const maxVotes = user.max_votes_allowed || 1;
    const proxyDelegationsQuery = `
      SELECT 
        pg.id as proxy_group_id,
        pg.principal_id as delegator_id,
        u.name as delegator_name,
        u.email as delegator_email,
        pg.appointment_type as vote_type,
        pg.is_active,
        pg.created_at,
        COUNT(DISTINCT v.id) as votes_used,
        ${maxVotes} as total_votes
      FROM proxy_groups pg
      INNER JOIN users u ON pg.principal_id = u.id
      LEFT JOIN votes v ON v.proxy_id = pg.id AND v.voter_id = ${userIdInt}
      WHERE EXISTS (
        SELECT 1 FROM proxy_group_members pgm 
        WHERE pgm.group_id = pg.id 
        AND pgm.member_id = ${userIdInt}
      )
      AND pg.is_active = 1
      GROUP BY pg.id, pg.principal_id, u.name, u.email, pg.appointment_type, pg.is_active, pg.created_at
    `;

    console.log('Fetching proxy delegations...'); // Debug log
    const proxyDelegations = await database.query(proxyDelegationsQuery);

    // For each proxy delegation, get the members and their allowed candidates
    for (let delegation of proxyDelegations) {
      // Get all members in this proxy group
      const membersQuery = `
        SELECT 
          pgm.id,
          pgm.member_id,
          pgm.appointment_type,
          u.name as member_name,
          u.email as member_email,
          u.member_number
        FROM proxy_group_members pgm
        INNER JOIN users u ON u.id = pgm.member_id
        WHERE pgm.group_id = ${delegation.proxy_group_id}
      `;
      
      const members = await database.query(membersQuery);
      
      // For each member with INSTRUCTIONAL appointment, get allowed candidates
      for (let member of members) {
        if (member.appointment_type === 'INSTRUCTIONAL') {
          const allowedCandidatesQuery = `
            SELECT 
              pmac.employee_id,
              e.name as candidate_name,
              e.position as candidate_position,
              d.name as candidate_department
            FROM proxy_member_allowed_candidates pmac
            INNER JOIN employees e ON e.id = pmac.employee_id
            LEFT JOIN departments d ON d.id = e.department_id
            WHERE pmac.proxy_member_id = ${member.id}
          `;
          
          const allowedCandidates = await database.query(allowedCandidatesQuery);
          member.allowed_candidates = allowedCandidates;
        } else {
          member.allowed_candidates = [];
        }
      }
      
      delegation.proxy_members = members;
    }

    console.log('Proxy delegations count:', proxyDelegations?.length || 0); // Debug log

    // Calculate totals
    const voteWeight = user.vote_weight || 1.0;
    const maxVotesAllowed = user.max_votes_allowed || 1;
    const minVotesRequired = user.min_votes_required || 1;

    const personalVotesUsed = personalVotes.length;
    const proxyVotesUsed = proxyVotes.length;
    const totalVotesUsed = personalVotesUsed + proxyVotesUsed;

    // Calculate remaining votes
    const personalVotesTotal = maxVotesAllowed;
    const personalVotesRemaining = Math.max(0, personalVotesTotal - personalVotesUsed);

    // Calculate proxy votes total from all delegations
    const proxyVotesTotal = proxyDelegations.reduce((sum, del) => sum + (del.total_votes || 0), 0);
    const proxyVotesRemaining = Math.max(0, proxyVotesTotal - proxyVotesUsed);

    const totalVotesRemaining = personalVotesRemaining + proxyVotesRemaining;

    // Format vote history
    const voteHistory = [
      ...personalVotes.map(vote => ({
        id: vote.id.toString(),
        type: vote.vote_type,
        targetId: (vote.employee_id || vote.resolution_id).toString(),
        targetName: vote.target_name,
        targetPosition: vote.target_position,
        targetDepartment: vote.target_department,
        voteValue: vote.vote_choice || 'VOTE',
        votedAt: vote.created_at,
        isProxy: false,
        weight: vote.vote_weight || 1
      })),
      ...proxyVotes.map(vote => ({
        id: vote.id.toString(),
        type: vote.vote_type,
        targetId: (vote.employee_id || vote.resolution_id).toString(),
        targetName: vote.target_name,
        targetPosition: vote.target_position,
        targetDepartment: vote.target_department,
        voteValue: vote.vote_choice || 'VOTE',
        votedAt: vote.created_at,
        isProxy: true,
        proxyFor: {
          id: vote.delegator_id?.toString() || '',
          name: vote.delegator_name || 'Unknown',
          email: vote.delegator_email || ''
        },
        weight: vote.vote_weight || 1
      }))
    ].sort((a, b) => new Date(b.votedAt) - new Date(a.votedAt));

    // Format proxy delegations
    const formattedDelegations = proxyDelegations.map(delegation => ({
      id: `proxy-${delegation.proxy_group_id}`,
      delegatorId: delegation.delegator_id?.toString() || '',
      delegatorName: delegation.delegator_name,
      delegatorEmail: delegation.delegator_email,
      voteType: delegation.vote_type || 'both',
      remainingVotes: (delegation.total_votes || 0) - (delegation.votes_used || 0),
      totalVotes: delegation.total_votes || 0,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      proxyMembers: delegation.proxy_members?.map(member => ({
        id: member.member_id?.toString() || '',
        name: member.member_name,
        email: member.member_email,
        memberNumber: member.member_number,
        appointmentType: member.appointment_type || 'DISCRETIONARY',
        allowedCandidates: member.allowed_candidates?.map(candidate => ({
          id: candidate.employee_id?.toString() || '',
          name: candidate.candidate_name,
          position: candidate.candidate_position,
          department: candidate.candidate_department
        })) || []
      })) || []
    }));

    // Get proxy groups WHERE THIS USER IS THE PRINCIPAL (others vote for them)
    console.log('Fetching proxy groups where user is principal...'); // Debug log
    const myProxyGroupsQuery = `
      SELECT 
        pg.id,
        pg.group_name,
        pg.appointment_type,
        pg.is_active,
        pg.created_at
      FROM proxy_groups pg
      WHERE pg.principal_id = ${userIdInt}
    `;
    
    const myProxyGroups = await database.query(myProxyGroupsQuery);
    console.log('My proxy groups count:', myProxyGroups?.length || 0); // Debug log
    
    // For each proxy group, get the members and their allowed candidates
    for (let group of myProxyGroups) {
      // Get all members in this proxy group
      const membersQuery = `
        SELECT 
          pgm.id,
          pgm.member_id,
          pgm.appointment_type,
          u.name as member_name,
          u.email as member_email,
          u.member_number
        FROM proxy_group_members pgm
        INNER JOIN users u ON u.id = pgm.member_id
        WHERE pgm.group_id = ${group.id}
      `;
      
      const members = await database.query(membersQuery);
      
      // For each member with INSTRUCTIONAL appointment, get allowed candidates
      for (let member of members) {
        if (member.appointment_type === 'INSTRUCTIONAL') {
          const allowedCandidatesQuery = `
            SELECT 
              pmac.employee_id,
              e.name as candidate_name,
              e.position as candidate_position,
              d.name as candidate_department
            FROM proxy_member_allowed_candidates pmac
            INNER JOIN employees e ON e.id = pmac.employee_id
            LEFT JOIN departments d ON d.id = e.department_id
            WHERE pmac.proxy_member_id = ${member.id}
          `;
          
          const allowedCandidates = await database.query(allowedCandidatesQuery);
          member.allowed_candidates = allowedCandidates;
        } else {
          member.allowed_candidates = [];
        }
      }
      
      group.proxy_members = members;
    }

    // Format my proxy groups
    const formattedMyProxyGroups = myProxyGroups.map(group => ({
      id: group.id?.toString() || '',
      groupName: group.group_name || 'Unnamed Group',
      appointmentType: group.appointment_type || 'MIXED',
      isActive: group.is_active || false,
      createdAt: group.created_at || new Date(),
      proxyMembers: group.proxy_members?.map(member => ({
        id: member.member_id?.toString() || '',
        name: member.member_name,
        email: member.member_email,
        memberNumber: member.member_number,
        appointmentType: member.appointment_type || 'DISCRETIONARY',
        allowedCandidates: member.allowed_candidates?.map(candidate => ({
          id: candidate.employee_id?.toString() || '',
          name: candidate.candidate_name,
          position: candidate.candidate_position,
          department: candidate.candidate_department
        })) || []
      })) || []
    }));

    res.json({
      success: true,
      data: {
        personalVotesRemaining,
        personalVotesTotal,
        proxyVotesRemaining,
        proxyVotesTotal,
        totalVotesRemaining,
        totalVotesUsed,
        voteHistory,
        proxyDelegations: formattedDelegations,
        myProxyGroups: formattedMyProxyGroups,
        userInfo: {
          voteWeight,
          maxVotesAllowed,
          minVotesRequired
        }
      }
    });

  } catch (error) {
    console.error('Error fetching voting status:', error);
    console.error('Error stack:', error.stack); // More detailed error info
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voting status',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get quick summary (for status bar)
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);

    // Get user's max votes - use ISNULL for columns that might not exist
    const userQuery = `
      SELECT 
        ISNULL(max_votes_allowed, 1) as max_votes_allowed, 
        ISNULL(vote_weight, 1.0) as vote_weight
      FROM users
      WHERE id = ${userIdInt}
    `;
    
    const users = await database.query(userQuery);
    
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    const maxVotesAllowed = user.max_votes_allowed || 1;

    // Count votes cast
    const voteCountQuery = `
      SELECT COUNT(*) as vote_count
      FROM votes
      WHERE voter_id = ${userIdInt}
    `;

    const voteCount = await database.query(voteCountQuery);
    const votesUsed = voteCount[0]?.vote_count || 0;
    const votesRemaining = Math.max(0, maxVotesAllowed - votesUsed);

    res.json({
      success: true,
      data: {
        votesRemaining,
        votesTotal: maxVotesAllowed,
        votesUsed,
        voteWeight: user.vote_weight || 1.0
      }
    });

  } catch (error) {
    console.error('Error fetching voting summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voting summary',
      error: error.message
    });
  }
});

export default router;
