import express from 'express';
import Employee from '../models/Employee.js';
import Proxy from '../models/Proxy.js'; 
import database from '../config/database.js';
const router = express.Router();

// Check if user has any proxy groups (to determine button text)
router.get('/proxy-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const groups = await database.query(`
      SELECT COUNT(*) as groupCount 
      FROM proxy_groups 
      WHERE principal_id = ${userId}
    `);
    
    const hasProxyGroups = groups[0].groupCount > 0;
    
    res.json({ 
      success: true, 
      hasProxyGroups,
      groupCount: groups[0].groupCount
    });
  } catch (error) {
    console.error('Error checking proxy status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check if any proxy member has voted on behalf of the principal
router.get('/proxy-voting-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all proxy group members for groups where user is principal
    const votesCheck = await database.query(`
      SELECT 
        pgm.id as proxy_member_id,
        pgm.member_id,
        pgm.full_name,
        COUNT(v.id) as vote_count,
        CASE WHEN COUNT(v.id) > 0 THEN 1 ELSE 0 END as has_voted
      FROM proxy_groups pg
      INNER JOIN proxy_group_members pgm ON pg.id = pgm.group_id
      LEFT JOIN votes v ON v.voted_by_id = pgm.member_id AND v.voted_for_id = ${userId}
      WHERE pg.principal_id = ${userId}
      GROUP BY pgm.id, pgm.member_id, pgm.full_name
    `);
    
    const anyVotesCast = votesCheck.some(member => member.has_voted === 1);
    const membersWhoVoted = votesCheck.filter(member => member.has_voted === 1);
    
    res.json({ 
      success: true, 
      canEdit: !anyVotesCast,
      anyVotesCast,
      membersWhoVoted,
      allMembers: votesCheck
    });
  } catch (error) {
    console.error('Error checking proxy voting status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get proxy groups with full details for editing
router.get('/proxy-groups/:userId/edit', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get proxy groups where user is principal
    const groups = await database.query(`
      SELECT 
        pg.*,
        CASE WHEN EXISTS (
          SELECT 1 FROM votes v 
          INNER JOIN proxy_group_members pgm ON v.voted_by_id = pgm.member_id 
          WHERE pgm.group_id = pg.id AND v.voted_for_id = ${userId}
        ) THEN 1 ELSE 0 END as has_votes_cast
      FROM proxy_groups pg 
      WHERE pg.principal_id = ${userId}
      ORDER BY pg.created_at DESC
    `);
    
    for (let group of groups) {
      // Get members for each group
      const members = await database.query(`
        SELECT 
          pgm.*,
          u.name,
          u.email,
          CASE WHEN EXISTS (
            SELECT 1 FROM votes v 
            WHERE v.voted_by_id = pgm.member_id AND v.voted_for_id = ${userId}
          ) THEN 1 ELSE 0 END as has_voted
        FROM proxy_group_members pgm
        LEFT JOIN users u ON u.id = pgm.member_id
        WHERE pgm.group_id = ${group.id}
        ORDER BY pgm.created_at
      `);
      
      // For each member, get their allowed candidates
      for (let member of members) {
        if (member.appointment_type === 'INSTRUCTIONAL') {
          const allowedCandidates = await database.query(`
            SELECT 
              pmac.employee_id,
              e.name,
              e.position,
              d.name as department
            FROM proxy_member_allowed_candidates pmac
            INNER JOIN employees e ON e.id = pmac.employee_id
            LEFT JOIN departments d ON d.id = e.department_id
            WHERE pmac.proxy_member_id = ${member.id}
          `);
          
          member.allowed_candidates = allowedCandidates;
        } else {
          member.allowed_candidates = [];
        }
      }
      
      group.proxy_group_members = members;
      group.canEdit = group.has_votes_cast === 0;
    }
    
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Error fetching proxy groups for editing:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update proxy group (only if no votes cast)
router.put('/proxy-group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, groupName, appointmentType, agmVotes, members } = req.body;
    
    // Check if any votes have been cast
    const votesCheck = await database.query(`
      SELECT COUNT(*) as vote_count
      FROM votes v
      INNER JOIN proxy_group_members pgm ON v.voted_by_id = pgm.member_id
      WHERE pgm.group_id = ${groupId} AND v.voted_for_id = ${userId}
    `);
    
    if (votesCheck[0].vote_count > 0) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit proxy group - votes have already been cast by proxy members'
      });
    }
    
    // Update proxy group
    await database.query(`
      UPDATE proxy_groups
      SET 
        group_name = '${groupName}',
        appointment_type = '${appointmentType}',
        trustee_remuneration = ${agmVotes?.trusteeRemuneration ? `'${agmVotes.trusteeRemuneration}'` : 'NULL'},
        remuneration_policy = ${agmVotes?.remunerationPolicy ? `'${agmVotes.remunerationPolicy}'` : 'NULL'},
        auditors_appointment = ${agmVotes?.auditorsAppointment ? `'${agmVotes.auditorsAppointment}'` : 'NULL'},
        agm_motions = ${agmVotes?.agmMotions ? `'${agmVotes.agmMotions}'` : 'NULL'},
        updated_at = GETDATE()
      WHERE id = ${groupId}
    `);
    
    res.json({
      success: true,
      message: 'Proxy group updated successfully'
    });
  } catch (error) {
    console.error('Error updating proxy group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete proxy group member (only if no votes cast)
router.delete('/proxy-member/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { userId } = req.query;
    
    // Check if this member has voted
    const votesCheck = await database.query(`
      SELECT COUNT(*) as vote_count
      FROM votes v
      WHERE v.voted_by_id = (SELECT member_id FROM proxy_group_members WHERE id = ${memberId})
        AND v.voted_for_id = ${userId}
    `);
    
    if (votesCheck[0].vote_count > 0) {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove this proxy member - they have already cast votes on your behalf'
      });
    }
    
    // Delete allowed candidates first
    await database.query(`
      DELETE FROM proxy_member_allowed_candidates
      WHERE proxy_member_id = ${memberId}
    `);
    
    // Delete member
    await database.query(`
      DELETE FROM proxy_group_members
      WHERE id = ${memberId}
    `);
    
    res.json({
      success: true,
      message: 'Proxy member removed successfully'
    });
  } catch (error) {
    console.error('Error removing proxy member:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add proxy group member
router.post('/proxy-member', async (req, res) => {
  try {
    const { groupId, userId, member } = req.body;
    
    // Check if group has votes cast
    const votesCheck = await database.query(`
      SELECT COUNT(*) as vote_count
      FROM votes v
      INNER JOIN proxy_group_members pgm ON v.voted_by_id = pgm.member_id
      WHERE pgm.group_id = ${groupId} AND v.voted_for_id = ${userId}
    `);
    
    if (votesCheck[0].vote_count > 0) {
      return res.status(403).json({
        success: false,
        message: 'Cannot add proxy members - votes have already been cast in this group'
      });
    }
    
    // Look up member by membership number
    const memberLookup = await database.query(`
      SELECT id, name FROM users WHERE member_number = '${member.membershipNumber}'
    `);
    
    if (!memberLookup || memberLookup.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in system'
      });
    }
    
    const memberId = memberLookup[0].id;
    
    // Create proxy group member
    const result = await database.query(`
      INSERT INTO proxy_group_members (
        group_id, member_id, initials, surname, full_name, 
        membership_number, id_number, appointment_type
      )
      OUTPUT INSERTED.id
      VALUES (
        ${groupId}, ${memberId}, '${member.initials}', '${member.surname}', 
        '${member.fullName}', '${member.membershipNumber}', '${member.idNumber}', 
        '${member.appointmentType}'
      )
    `);
    
    const proxyMemberId = result[0].id;
    
    // Add allowed candidates if instructional
    if (member.appointmentType === 'INSTRUCTIONAL' && member.allowedCandidates && member.allowedCandidates.length > 0) {
      for (const candidateId of member.allowedCandidates) {
        await database.query(`
          INSERT INTO proxy_member_allowed_candidates (proxy_member_id, employee_id)
          VALUES (${proxyMemberId}, ${candidateId})
        `);
      }
    }
    
    res.json({
      success: true,
      message: 'Proxy member added successfully',
      memberId: proxyMemberId
    });
  } catch (error) {
    console.error('Error adding proxy member:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/registration-data-forms', async (req, res) => {
  try {
    const rows = await Employee.getAllProxy();

    const formMap = new Map();

    for (const row of rows) {
      if (!formMap.has(row.id)) {
        formMap.set(row.id, {
          id: row.id.toString(),
          formId: row.form_id,
          userId: row.user_id,
          title: row.title,
          initials: row.initials,
          surname: row.surname,
          fullNames: row.full_names,
          membershipNumber: row.membership_number,
          idPassportNumber: row.id_passport_number,
          appointmentType: row.appointment_type,
          voting: {
            trusteeRemuneration: row.trustee_remuneration,
            remunerationPolicy: row.remuneration_policy,
            auditorsAppointment: row.auditors_appointment,
            agmMotions: row.agm_motions,
            candidates: [row.candidate1, row.candidate2, row.candidate3]
          },
          signedAt: row.signed_at,
          signatureDate: row.signature_date,
          status: row.status,
          submittedAt: row.submitted_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          proxyMembers: []
        });
      }

      if (row.proxy_member_id) {
        formMap.get(row.id).proxyMembers.push({
          id: row.proxy_member_id,
          fullNames: row.proxy_member_full_names,
          surname: row.proxy_member_surname,
          initials: row.proxy_member_initials,
          membershipNumber: row.proxy_member_membership_number,
          idPassportNumber: row.proxy_member_id_passport_number,
          confirmedFullNames: row.proxy_member_confirmed_full_names,
          confirmedSurname: row.proxy_member_confirmed_surname
        });
      }
    }

    const transformedForms = Array.from(formMap.values());

    res.json({
      success: true,
      data: transformedForms
    });
  } catch (error) {
    console.error('Error fetching proxy forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proxy forms'
    });
  }
});

router.get('/registration-data-forms/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID'
    });
  }

  try {
    const rows = await Employee.getProxyFormsByUser(userId);

    const formMap = new Map();

    for (const row of rows) {
      if (!formMap.has(row.id)) {
        formMap.set(row.id, {
          id: row.id.toString(),
          formId: row.form_id,
          userId: row.user_id,
          title: row.title,
          initials: row.initials,
          surname: row.surname,
          fullNames: row.full_names,
          membershipNumber: row.membership_number,
          idPassportNumber: row.id_passport_number,
          appointmentType: row.appointment_type,
          voting: {
            trusteeRemuneration: row.trustee_remuneration,
            remunerationPolicy: row.remuneration_policy,
            auditorsAppointment: row.auditors_appointment,
            agmMotions: row.agm_motions,
            candidates: [row.candidate1, row.candidate2, row.candidate3]
          },
          signedAt: row.signed_at,
          signatureDate: row.signature_date,
          status: row.status,
          submittedAt: row.submitted_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          proxyMembers: []
        });
      }

      if (row.proxy_member_id) {
        formMap.get(row.id).proxyMembers.push({
          id: row.proxy_member_id,
          fullNames: row.proxy_member_full_names,
          surname: row.proxy_member_surname,
          initials: row.proxy_member_initials,
          membershipNumber: row.proxy_member_membership_number,
          idPassportNumber: row.proxy_member_id_passport_number,
          confirmedFullNames: row.proxy_member_confirmed_full_names,
          confirmedSurname: row.proxy_member_confirmed_surname
        });
      }
    }

    const transformedForms = Array.from(formMap.values());

    res.json({
      success: true,
      data: transformedForms
    });
  } catch (error) {
    console.error('Error fetching proxy forms for user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proxy forms for user'
    });
  }
});


router.get('/proxy-form', async (req, res) => {
  try {
    // 1. Get all proxy appointments
    const appointments = await database.query(`
      SELECT pa.*, u.name AS member_name
      FROM proxy_appointments pa
      LEFT JOIN users u ON u.member_number = pa.member_membership_number
      ORDER BY pa.created_at DESC
    `);

    const results = [];

    for (const appointment of appointments) {
      let proxyGroup = null;
      let proxyGroupMembers = [];

      if (appointment.group_id) {
        // 2. Get proxy group with principal info
        const groupResult = await database.query(`
          SELECT pg.*, u.name AS principal_name, u.member_number AS principal_member_number
          FROM proxy_groups pg
          LEFT JOIN users u ON u.id = pg.principal_id
          WHERE pg.id = ${appointment.group_id}
        `);
        proxyGroup = groupResult[0];

        // 3. Get proxy group members with stored metadata
        const membersResult = await database.query(`
          SELECT 
            pgm.id,
            pgm.group_id,
            pgm.member_id,
            pgm.initials,
            pgm.surname,
            pgm.full_name,
            pgm.membership_number,
            pgm.id_number,
            u.name AS user_name
          FROM proxy_group_members pgm
          LEFT JOIN users u ON u.id = pgm.member_id
          WHERE pgm.group_id = ${appointment.group_id}
        `);
        proxyGroupMembers = membersResult;
      }

      results.push({
        appointment,
        proxy_group: proxyGroup,
        proxy_group_members: proxyGroupMembers
      });
    }

    res.status(200).json({
      status: 'success',
      data: results
    });
  } catch (error) {
    console.error('Error fetching proxy appointments:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// router.get('/proxy-form/:id', async (req, res) => {
//   try {
//     const userId = parseInt(req.params.id);
//     if (!userId || isNaN(userId)) {
//       return res.status(400).json({ status: 'error', message: 'Invalid user ID' });
//     }

//     // 1. Get proxy appointments for this user
//     const appointments = await database.query(`
//       SELECT pa.*, u.name AS member_name
//       FROM proxy_appointments pa
//       LEFT JOIN users u ON u.member_number = pa.member_membership_number
//       WHERE u.id = ${userId}
//       ORDER BY pa.created_at DESC
//     `);

//     const results = [];

//     for (const appointment of appointments) {
//       let proxyGroup = null;
//       let proxyGroupMembers = [];

//       if (appointment.group_id) {
//         // 2. Get proxy group with principal info
//         const groupResult = await database.query(`
//           SELECT pg.*, u.name AS principal_name, u.member_number AS principal_member_number
//           FROM proxy_groups pg
//           LEFT JOIN users u ON u.id = pg.principal_id
//           WHERE pg.id = ${appointment.group_id}
//         `);
//         proxyGroup = groupResult[0];

//         // 3. Get proxy group members with stored metadata
//         const membersResult = await database.query(`
//           SELECT 
//             pgm.id,
//             pgm.group_id,
//             pgm.member_id,
//             pgm.initials,
//             pgm.surname,
//             pgm.full_name,
//             pgm.membership_number,
//             pgm.id_number,
//             u.name AS user_name
//           FROM proxy_group_members pgm
//           LEFT JOIN users u ON u.id = pgm.member_id
//           WHERE pgm.group_id = ${appointment.group_id}
//         `);
//         proxyGroupMembers = membersResult;
//       }

//       results.push({
//         appointment,
//         proxy_group: proxyGroup,
//         proxy_group_members: proxyGroupMembers
//       });
//     }

//     res.status(200).json({
//       status: 'success',
//       data: results
//     });
//   } catch (error) {
//     console.error('Error fetching proxy appointments by user ID:', error);
//     res.status(500).json({ status: 'error', message: error.message });
//   }
// });

router.get('/proxy-form/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get proxy groups where user is principal
    const groups = await database.query(`
      SELECT * FROM proxy_groups WHERE principal_id = ${userId}
    `);
    
    for (let group of groups) {
      // Get members for each group
      const members = await database.query(`
        SELECT * FROM proxy_group_members WHERE group_id = ${group.id}
      `);
      
      // For each member, get their allowed candidates
      for (let member of members) {
        const allowedCandidates = await database.query(`
          SELECT employee_id FROM proxy_member_allowed_candidates 
          WHERE proxy_member_id = ${member.id}
        `);
        
        member.allowed_candidates = allowedCandidates.map(ac => ac.employee_id);
      }
      
      group.proxy_group_members = members;
    }
    
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Error fetching proxy groups:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});



router.post('/proxy-form', async (req, res) => {
  try {
    const {
      proxy_groups,
      proxy_group_members,
      trustee_remuneration,
      remuneration_policy,
      auditors_appointment,
      agm_motions,
      total_available_votes,
      total_allocated_votes,
      ...appointmentData
    } = req.body;

    console.log('proxy_groups:', proxy_groups);
    console.log('proxy_group_members:', proxy_group_members);
    console.log('appointmentData:', appointmentData);
    console.log('Vote allocation:', { total_available_votes, total_allocated_votes });

    let proxyGroupId = null;

    // Determine the overall appointment type for the group and form
    // For proxy_groups: use MIXED if types differ, otherwise use the single type
    // For proxy_appointments: use INSTRUCTIONAL if ANY member is instructional (requires AGM votes), otherwise DISCRETIONAL
    const appointmentTypes = proxy_group_members.map(m => m.appointment_type);
    const uniqueTypes = [...new Set(appointmentTypes)];
    const groupAppointmentType = uniqueTypes.length === 1 ? uniqueTypes[0] : 'MIXED';
    const formAppointmentType = appointmentTypes.includes('INSTRUCTIONAL') ? 'INSTRUCTIONAL' : 'DISCRETIONAL';

    // 1. Resolve principal_id from membership_number
    if (proxy_groups) {
      const userLookup = await database.query(`
        SELECT id FROM users WHERE member_number = '${proxy_groups.principal_member_id}'
      `);

      if (!userLookup || userLookup.length === 0) {
        throw new Error('Principal member not found in users table');
      }

      const principalId = userLookup[0].id;

      // 2. Create proxy group with appointment type, AGM voting instructions, and total votes
      proxyGroupId = await Proxy.creategroupData({
        group_name: proxy_groups.group_name,
        principal_id: principalId,
        appointment_type: groupAppointmentType,
        trustee_remuneration: trustee_remuneration || null,
        remuneration_policy: remuneration_policy || null,
        auditors_appointment: auditors_appointment || null,
        agm_motions: agm_motions || null,
        total_votes_delegated: total_allocated_votes || 0,
        is_active: false
      });

      // 3. Add members to group with their individual appointment types and votes
      for (const member of proxy_group_members) {
        const memberLookup = await database.query(`
          SELECT id FROM users WHERE member_number = '${member.membership_number}'
        `);

        if (!memberLookup || memberLookup.length === 0) {
          throw new Error(`Member ${member.full_name} not found in users table`);
        }

        const memberId = memberLookup[0].id;

        // Create proxy group member with appointment type and votes allocated
        const proxyMemberId = await Proxy.creategroup_id({
          group_id: proxyGroupId,
          member_id: memberId,
          initials: member.initials,
          surname: member.surname,
          full_name: member.full_name,
          membership_number: member.membership_number,
          id_number: member.id_number,
          appointment_type: member.appointment_type,
          votes_allocated: member.votes_allocated || 0
        });

        // 4. Add allowed candidates for instructional proxy members
        // Support both snake_case (allowed_candidates) and camelCase (allowedCandidates)
        const memberAllowedCandidates = member.allowed_candidates || member.allowedCandidates || [];
        if (member.appointment_type === 'INSTRUCTIONAL' && Array.isArray(memberAllowedCandidates) && memberAllowedCandidates.length > 0) {
          for (const candidateId of memberAllowedCandidates) {
            await Proxy.addAllowedCandidate({
              proxy_member_id: proxyMemberId,
              employee_id: candidateId
            });
          }
        }

        // 5. Create vote splitting settings for this proxy member
        // This tracks how votes are split between principal and proxy
        await database.query(`
          INSERT INTO vote_splitting_settings (
            user_id, 
            proxy_member_id, 
            votes_allocated,
            appointment_type,
            is_active
          ) VALUES (
            ${principalId}, 
            ${proxyMemberId}, 
            ${member.votes_allocated || 0},
            '${member.appointment_type}',
            0
          )
        `);
      }

      // NEW: Persist allowed candidates if an 'assignee' object was provided in the payload
      // This allows the assignee form to submit a top-level 'assignee' with allowed candidates
      if (req.body.assignee && (req.body.assignee.allowedCandidates || req.body.assignee.allowed_candidates)) {
        try {
          const assigneeObj = req.body.assignee;
          const allowedList = assigneeObj.allowedCandidates || assigneeObj.allowed_candidates || [];

          // Attempt to locate the proxy_group_member record for the assignee using membership_number or user id
          const memberMembershipNumber = assigneeObj.memberNumber || assigneeObj.membershipNumber || assigneeObj.member_membership_number || '';
          let pgmRows = [];
          if (memberMembershipNumber) {
            pgmRows = await database.query(`
              SELECT id FROM proxy_group_members WHERE group_id = ${proxyGroupId} AND membership_number = '${memberMembershipNumber}'
            `);
          } else if (assigneeObj.id) {
            pgmRows = await database.query(`
              SELECT id FROM proxy_group_members WHERE group_id = ${proxyGroupId} AND member_id = ${assigneeObj.id}
            `);
          }

          if (pgmRows && pgmRows.length > 0) {
            const proxyMemberIdForAssignee = pgmRows[0].id;
            for (const candidateId of allowedList) {
              await Proxy.addAllowedCandidate({
                proxy_member_id: proxyMemberIdForAssignee,
                employee_id: candidateId
              });
            }
          }
        } catch (err) {
          console.error('Failed to persist assignee allowed candidates:', err);
        }
      }

      // 6. Deduct allocated votes from principal's personal vote weight
      // This ensures votes are transferred, not duplicated
      await database.query(`
        UPDATE users 
        SET vote_weight = GREATEST(0, COALESCE(vote_weight, 1) - ${total_allocated_votes || 0})
        WHERE id = ${principalId}
      `);
    }

    // 5. Create proxy appointment with group_id and valid appointment_type
    const appointmentId = await Proxy.createappointmentData({
      ...appointmentData,
      appointment_type: formAppointmentType,
      group_id: proxyGroupId
    });

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Proxy appointment created successfully. Votes have been allocated to your proxy members.',
      appointment_id: appointmentId,
      proxy_group_id: proxyGroupId,
      votes_allocated: total_allocated_votes
    });
  } catch (error) {
    console.error('Error creating proxy appointment:', error);
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

// Admin endpoint: Delete a proxy group
router.delete('/admin/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check if any votes have been cast
    const votesCheck = await database.query(`
      SELECT COUNT(*) as vote_count
      FROM votes v
      INNER JOIN proxy_group_members pgm ON v.voted_by_id = pgm.member_id
      WHERE pgm.group_id = ${groupId}
    `);
    
    if (votesCheck[0].vote_count > 0) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete proxy group - votes have already been cast by proxy members'
      });
    }
    
    // Delete allowed candidates for all members
    await database.query(`
      DELETE pmac FROM proxy_member_allowed_candidates pmac
      INNER JOIN proxy_group_members pgm ON pmac.proxy_member_id = pgm.id
      WHERE pgm.group_id = ${groupId}
    `);
    
    // Delete proxy group members
    await database.query(`
      DELETE FROM proxy_group_members WHERE group_id = ${groupId}
    `);
    
    // Delete the group
    await database.query(`
      DELETE FROM proxy_groups WHERE id = ${groupId}
    `);
    
    res.json({
      success: true,
      message: 'Proxy group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting proxy group:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/proxy-group/:id/activate', async (req, res) => {
    console.log('this is the id', req.params.id);
  try {
    const groupId = req.params.id;
    await Proxy.activateGroup(groupId);
    res.status(200).json({ status: 'success', message: 'Proxy group activated' });
  } catch (error) {
    console.error('Error activating proxy group:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.patch('/proxy-group/:id/deactivate', async (req, res) => {
    console.log('this is the id', req.params.id);
  try {
    const groupId = req.params.id;
    await Proxy.deactivateGroup(groupId);
    res.status(200).json({ status: 'success', message: 'Proxy group deactivated' });
  } catch (error) {
    console.error('Error deactivating proxy group:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Admin endpoint: Get all proxy groups with full details
router.get('/admin/all-groups', async (req, res) => {
  try {
    // Get all proxy groups
    const groups = await database.query(`
      SELECT 
        pg.*,
        u.name as principal_name,
        u.email as principal_email,
        u.member_number as principal_member_number,
        CASE WHEN EXISTS (
          SELECT 1 FROM votes v 
          INNER JOIN proxy_group_members pgm ON v.voted_by_id = pgm.member_id 
          WHERE pgm.group_id = pg.id
        ) THEN 1 ELSE 0 END as has_votes_cast
      FROM proxy_groups pg 
      LEFT JOIN users u ON u.id = pg.principal_id
      ORDER BY pg.created_at DESC
    `);
    
    // For each group, get its members
    for (let group of groups) {
      const members = await database.query(`
        SELECT 
          pgm.*,
          u.name as member_name,
          u.email as member_email,
          u.member_number,
          ISNULL(pgm.votes_allocated, 0) as votes_allocated,
          CASE WHEN EXISTS (
            SELECT 1 FROM votes v 
            WHERE v.voted_by_id = pgm.member_id 
            AND v.voted_for_id = ${group.principal_id}
          ) THEN 1 ELSE 0 END as has_voted
        FROM proxy_group_members pgm
        LEFT JOIN users u ON u.id = pgm.member_id
        WHERE pgm.group_id = ${group.id}
        ORDER BY pgm.created_at
      `);
      
      // For each INSTRUCTIONAL member, get allowed candidates
      for (let member of members) {
        if (member.appointment_type === 'INSTRUCTIONAL') {
          const allowedCandidates = await database.query(`
            SELECT 
              pmac.employee_id,
              e.name as candidate_name,
              e.position,
              d.name as department
            FROM proxy_member_allowed_candidates pmac
            INNER JOIN employees e ON e.id = pmac.employee_id
            LEFT JOIN departments d ON d.id = e.department_id
            WHERE pmac.proxy_member_id = ${member.id}
          `);
          member.allowed_candidates = allowedCandidates;
        } else {
          member.allowed_candidates = [];
        }
      }
      
      group.members = members;
      group.member_count = members.length;
      group.total_votes_allocated = members.reduce((sum, m) => sum + (m.votes_allocated || 0), 0);
    }
    
    res.json({ 
      success: true, 
      data: groups,
      count: groups.length
    });
  } catch (error) {
    console.error('Error fetching all proxy groups:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;


