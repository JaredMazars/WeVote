import express from 'express';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Vote from '../models/Vote.js';
import auth from '../middleware/auth.js';
import emailService from '../services/emailService.js';
import database from "../config/database.js";

// function decodeJWT(token) {
//   try {
//     const payload = token.split('.')[1];
//     const decoded = JSON.parse(atob(payload));
//     return decoded;
//   } catch (error) {
//     console.error('Error decoding token:', error);
//     return null;
//   }
// }

function decodeJWT(token) {
  try {
    if (!token) {
      console.log('No token provided to decodeJWT');
      return null;
    }
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

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

// Get employee voting statistics - THIS MUST COME FIRST
router.get('/stats/voting', async (req, res) => {
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

// If you're using Node.js v18+, fetch is built-in. Otherwise, install node-fetch:
// npm install node-fetch
// const fetch = require('node-fetch');

async function sendEmployeesViaWhatsApp(employees, recipientPhone) {
  const token = process.env.WHATSAPP_TOKEN;

  const messageBody = employees.map((emp, index) =>
    `👤 ${emp.id}. *${emp.name}*`
  ).join('\n\n');

  const payload = {
    messaging_product: 'whatsapp',
    to: recipientPhone,
    type: 'text',
    text: {
      body: `🏆 *Employee Voting List*\n\n${messageBody}`
    }
  };

  try {
    const response = await fetch('https://graph.facebook.com/v22.0/775630422307673/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('WhatsApp response:', result);
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

router.post('/send-whatsapp', async (req, res) => {
  const { employees, to } = req.body;
  try {
    const result = await sendEmployeesViaWhatsApp(employees, to);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// router.get('/webhook', (req, res) => {
//   const VERIFY_TOKEN = 'wevote123'; // must match what you entered in Meta

//   console.log('Webhook verification request:', req.query);
//   res.sendStatus(200);
// });

// whatsappRouter.post('/webhook', async (req, res) => {
//   const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
//   const idNumber = message?.text?.body;

//   if (idNumber) {
//     const employee = await findEmployeeById(idNumber); // your database lookup
//     if (employee) {
//       await sendWhatsappReply(message.from, employee); // your reply logic
//     }
//   }

//   res.sendStatus(200);
// });

async function sendWhatsappReply(to, message) {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

  await fetch(
    `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        text: { body: message }
      })
    }
  );
}


// async function sendWhatsappReply(to, message) {
//   const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
//   const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

//       }
//     }
//   );
// }


// async function sendWhatsappReply(to, message) {
//   const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
//   const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

//   await axios.post(
//     `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
//     {
//       messaging_product: 'whatsapp',
//       to,
//       text: { body: message }
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${WHATSAPP_TOKEN}`,
//         'Content-Type': 'application/json'
//       }
//     }
//   );
// }

router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'wevote123'; // match Meta dashboard

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log(' Webhook verification failed');
    res.sendStatus(403);
  }
});


router.post('/webhook', async (req, res) => {
  try {
    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const phone = message?.from;
    const idText = message?.text?.body?.trim();

    const parsedId = parseInt(idText, 10);
    if (!parsedId || isNaN(parsedId)) {
      console.log(`⚠️ Invalid ID received from ${phone}: "${idText}"`);
      await sendWhatsappReply(phone, ` Please reply with a valid employee ID number.`);
      return res.sendStatus(200);
    }

    console.log(`📨 Received vote from ${phone} for employee ID: ${parsedId}`);

    const employee = await Employee.findatabaseyId(parsedId);
    if (!employee) {
      await sendWhatsappReply(phone, ` No employee found with ID ${parsedId}`);
      return res.sendStatus(200);
    }

    const summary = `
✅ You selected *${employee.name}* (${employee.position})
🏢 Department: ${employee.department}
📅 Years of Service: ${employee.years_of_service}
    `.trim();

    await sendWhatsappReply(phone, summary);
    res.sendStatus(200);
  } catch (err) {
    console.error(' Error handling webhook:', err);
    res.sendStatus(500);
  }
});



// Get all employees for voting
router.get('/', async (req, res) => {
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
// router.post('/:id/vote', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { comment } = req.body;

//     if (!id || isNaN(parseInt(id))) {
//       return res.status(400).json({ success: false, message: 'Invalid employee ID' });
//     }

//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
//     }
//     const decodedToken = decodeJWT(token);
//     const myId = decodedToken?.id;

//     if (!myId) {
//       return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
//     }

//     const voteData = {
//       voter_id: myId,
//       vote_type: 'employee',
//       target_id: parseInt(id),
//       comment: comment || null,
//       is_anonymous: 1,
//       ip_address: req.ip,
//       user_agent: req.get('User-Agent')
//     };

//     const voteId = await Vote.castVote(voteData);

//     res.json({ success: true, message: 'Vote cast successfully', voteId });
//   } catch (error) {
//     console.error('Error casting vote:', error);

//     if (error.message.includes('already voted')) {
//       return res.status(409).json({ success: false, message: error.message });
//     }

//     res.status(500).json({ success: false, message: 'Failed to cast vote' });
//   }
// });

// Router method - Add this to your routes
// router.put('/:id/vote/edit', async (req, res) => {
//   try {
//     const { id } = req.params; // employee_id or resolution_id
//     const { comment, vote_choice } = req.body;

//     if (!id || isNaN(parseInt(id))) {
//       return res.status(400).json({ success: false, message: 'Invalid target ID' });
//     }

//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
//     }

//     const decodedToken = decodeJWT(token);
//     const myId = decodedToken?.id;
//     if (!myId) {
//       return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
//     }

//     // Check if voting period is still active
//     const timerResult = await database.query(
//       `SELECT active, start_time, end_time FROM agm_timer WHERE id = 1`
//     );
    
//     if (timerResult.length === 0 || !timerResult[0].active) {
//       return res.status(403).json({ 
//         success: false, 
//         message: 'Voting period is not active. Edits are not allowed.' 
//       });
//     }

//     const timer = timerResult[0];
//     const now = new Date();
//     const [startH, startM] = timer.start_time.split(':').map(Number);
//     const [endH, endM] = timer.end_time.split(':').map(Number);
    
//     const votingStart = new Date(now);
//     const votingEnd = new Date(now);
//     votingStart.setHours(startH, startM, 0, 0);
//     votingEnd.setHours(endH, endM, 0, 0);

//     if (now < votingStart || now > votingEnd) {
//       return res.status(403).json({ 
//         success: false, 
//         message: 'Voting period has ended. Edits are no longer allowed.' 
//       });
//     }

//     const updateData = {
//       voter_id: myId,
//       target_id: parseInt(id),
//       comment: comment || null,
//       vote_choice: vote_choice || null
//     };

//     await Vote.editVote(updateData);

//     res.json({ success: true, message: 'Vote updated successfully' });
//   } catch (error) {
//     console.error('Error editing vote:', error);

//     if (error.message.includes('No vote found')) {
//       return res.status(404).json({ success: false, message: error.message });
//     }

//     res.status(500).json({ success: false, message: 'Failed to edit vote' });
//   }
// });
// Edit vote route
router.put('/:id/vote/edit', async (req, res) => {
  try {
    const { id } = req.params; // employee_id or resolution_id
    const { comment, vote_choice, vote_type } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: 'Invalid target ID' });
    }

    if (!vote_type || !['employee', 'resolution'].includes(vote_type)) {
      return res.status(400).json({ success: false, message: 'Invalid vote type' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const decodedToken = decodeJWT(token);
    const myId = decodedToken?.id;
    if (!myId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }

    // Check if voting period is still active
    const timerResult = await database.query(
      `SELECT active, start_time, end_time FROM agm_timer WHERE id = 1`
    );
    
    if (timerResult.length === 0 || !timerResult[0].active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Voting period is not active. Edits are not allowed.' 
      });
    }

    const timer = timerResult[0];
    const now = new Date();
    
    // Parse time strings (format: "HH:MM" or "HH:MM:SS")
    const startParts = timer.start_time.split(':').map(Number);
    const endParts = timer.end_time.split(':').map(Number);
    
    const votingStart = new Date(now);
    const votingEnd = new Date(now);
    votingStart.setHours(startParts[0], startParts[1], 0, 0);
    votingEnd.setHours(endParts[0], endParts[1], 0, 0);

    if (now < votingStart || now > votingEnd) {
      return res.status(403).json({ 
        success: false, 
        message: 'Voting period has ended. Edits are no longer allowed.' 
      });
    }

    const updateData = {
      voter_id: myId,
      target_id: parseInt(id),
      vote_type,
      comment: comment || null,
      vote_choice: vote_choice || null
    };

    await Vote.editVote(updateData);

    res.json({ success: true, message: 'Vote updated successfully' });
  } catch (error) {
    console.error('Error editing vote:', error);

    if (error.message.includes('No vote found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: 'Failed to edit vote' });
  }
});

// Remove vote route
// routes/vote.js or similar
router.delete('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { vote_type } = req.query;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: 'Invalid target ID' });
    }

    // if (!vote_type || !['employee', 'resolution'].includes(vote_type)) {
    //   return res.status(400).json({ success: false, message: 'Invalid vote type' });
    // }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const decodedToken = decodeJWT(token);
    const myId = decodedToken?.id;
    if (!myId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }

    // const timerResult = await database.query(
    //   `SELECT active, start_time, end_time FROM agm_timer WHERE id = 1`
    // );

    // if (timerResult.length === 0 || !timerResult[0].active) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: 'Voting period is not active. Vote removal is not allowed.' 
    //   });
    // }

    // const timer = timerResult[0];
    // const now = new Date();

    // const [startHour, startMin] = timer.start_time.split(':').map(Number);
    // const [endHour, endMin] = timer.end_time.split(':').map(Number);

    // const votingStart = new Date(now);
    // const votingEnd = new Date(now);
    // votingStart.setHours(startHour, startMin, 0, 0);
    // votingEnd.setHours(endHour, endMin, 0, 0);

    // if (now < votingStart || now > votingEnd) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: 'Voting period has ended. Vote removal is no longer allowed.' 
    //   });
    // }

    const removeData = {
      voter_id: myId,
      target_id: parseInt(id),
      vote_type
    };

    const removedCount = await Vote.removeVote(removeData);

    res.json({ 
      success: true, 
      message: `Vote removed successfully. ${removedCount} vote(s) deleted.`,
      removedCount 
    });
  } catch (error) {
    console.error('Error removing vote:', error);

    if (error.message.includes('No vote found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: 'Failed to remove vote' });
  }
});


// Model method - Add this to your Vote model


router.post('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, isProxyVote = true, groupId = 8 } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const decodedToken = decodeJWT(token);
    const myId = decodedToken?.id;
    if (!myId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }

    const voteData = {
      voter_id: myId,
      vote_type: 'employee',
      target_id: parseInt(id),
      comment: comment || null,
      is_anonymous: 1,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      is_proxy_vote: isProxyVote,
      group_id: groupId
    };

    const voteId = await Vote.castVote(voteData);

    res.json({ success: true, message: 'Vote cast successfully', voteId });
  } catch (error) {
    console.error('Error casting vote:', error);

    if (error.message.includes('already voted')) {
      return res.status(409).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: 'Failed to cast vote' });
  }
});


// Override proxy vote when principal member votes directly
// PUT /api/employees/:employeeId/vote/override
router.put('/:employeeId/vote/override', async (req, res) => {
  const { employeeId } = req.params;
  const { comment, groupId = 8 } = req.body;

  console.log(`🔧 Override vote request for employeeId: ${employeeId}`);

  // Validate employee ID
  if (!employeeId || isNaN(parseInt(employeeId))) {
    console.warn('⚠️ Invalid employee ID');
    return res.status(400).json({ success: false, message: 'Invalid employee ID' });
  }

  // Extract token
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.warn('⚠️ No token provided');
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  // Decode token
  const decodedToken = decodeJWT(token);
  const voterId = decodedToken?.id;
  if (!voterId) {
    console.warn('⚠️ Invalid token: missing voter ID');
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }

  console.log(`✅ Authenticated voterId: ${voterId}`);

  try {
    // 1. Invalidate all previous votes for this voter and employee
    console.log(`🗂️ Setting valid_vote = 0 for voterId ${voterId}`);
    const updateResult = await database.query(
      `UPDATE votes
       SET valid_vote = 0
       WHERE voter_id = ${voterId}
       AND vote_type = 'employee'
       AND valid_vote = 1`
    );

    const affectedRows = updateResult?.rowsAffected?.[0] ?? 0;
    console.log(`✅ Previous votes marked as invalid: ${affectedRows} row(s) updated`);

    // 2. Insert new vote with valid_vote = 1
    console.log('📝 Inserting new vote with valid_vote = 1');
    await database.query(
      `INSERT INTO votes (
         voter_id, vote_type, employee_id, vote_choice, comment,
         created_at, is_proxy_vote, is_anonymous, ip_address, user_agent, group_id, valid_vote
       ) VALUES (
         ${voterId}, 'employee', ${employeeId}, NULL,
         ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
         GETDATE(), 0, 1, '${req.ip}', '${req.get('User-Agent')}', ${groupId}, 1
       )`
    );
    console.log('✅ New vote recorded');

    res.json({
      success: true,
      message: `Previous votes invalidated (${affectedRows}). Your direct vote has been recorded.`,
    });

  } catch (error) {
    console.error('❌ Error overriding vote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to override vote'
    });
  }
});









// router.post('/split-vote', async (req, res) => {
//   try {
//     const { delegator_ids } = req.body;
//     console.log('Received delegator IDs for split vote:', delegator_ids);
//   //   const token = req.headers.authorization?.split(' ')[1];
//   //   if (!token) {
//   //     return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
//   //   }
//   //   const decodedToken = decodeJWT(token);
//   //   const myId = decodedToken?.id;
//   //   if (!myId) {
//   //     return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
//   //   }
//   //   const voteIds = [];

//   //   for (const memberId of memberIds) {
//   //     const voteData = {
//   //       voter_id: myId,
//   //       vote_type: 'employee',
//   //       target_id: memberId,
//   //       comment: comment || null,
//   //       is_anonymous: 1,
//   //       ip_address: req.ip,
//   //       user_agent: req.get('User-Agent'),
//   //       is_proxy_vote: isProxyVote,
//   //       group_id: groupId
//   //     };

//   //     const voteId = await Vote.castVote(voteData);
//   //     voteIds.push(voteId);
//   //   }

//   //   res.json({ success: true, message: 'Votes cast successfully', voteIds });
//   // } catch (error) {
//   //   console.error('Error casting split votes:', error);
//   //   res.status(500).json({ success: false, message: 'Failed to cast split votes' });
//   // }
//   } catch (error) {
//     console.error('Error casting split votes:', error);
//     res.status(500).json({ success: false, message: 'Failed to cast split votes' });
//   }
// });

// router.post('/split-vote', async (req, res) => {
//   try {
//     const { proxy_id, delegator_ids, vote_type, employee_id, resolution_id, vote_value, comment } = req.body;

//     console.log('📥 Received split vote request:', {
//       proxy_id,
//       delegator_ids,
//       vote_type,
//       employee_id,
//       resolution_id,
//       vote_value,
//       comment
//     });

//     // Validate input
//     console.log('🔍 Validating input...');
//     if (!delegator_ids || !Array.isArray(delegator_ids) || delegator_ids.length === 0) {
//       console.log('❌ Invalid delegator_ids');
//       return res.status(400).json({ success: false, message: 'Invalid delegator IDs: must be a non-empty array' });
//     }

//     if (!vote_type || (vote_type !== 'employee' && vote_type !== 'resolution')) {
//       console.log('❌ Invalid vote_type');
//       return res.status(400).json({ success: false, message: 'Invalid vote type: must be "employee" or "resolution"' });
//     }

//     const target_id = vote_type === 'employee' ? employee_id : resolution_id;
//     if (!target_id) {
//       console.log('❌ Missing target_id');
//       return res.status(400).json({ success: false, message: `Missing ${vote_type}_id` });
//     }

//     // Verify token
//     console.log('🔐 Verifying token...');
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       console.log('❌ No token provided');
//       return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
//     }

//     const decodedToken = decodeJWT(token);
//     const myId = decodedToken?.id;
//     if (!myId) {
//       console.log('❌ Invalid token');
//       return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
//     }

//     // if (myId !== proxy_id) {
//     //   console.log(`❌ Token user ID (${myId}) does not match proxy_id (${proxy_id})`);
//     //   return res.status(403).json({ success: false, message: 'Forbidden: Cannot cast votes on behalf of another proxy' });
//     // }

//     // Get proxy group
//     console.log('🔗 Fetching proxy group...');
//     const proxyGroupResult = await database.query(
//       `SELECT id FROM proxy_groups WHERE principal_id = ${proxy_id}`
//     );
//     const groupId = proxyGroupResult.length > 0 ? proxyGroupResult[0].id : null;

//     if (!groupId) {
//       console.log('❌ No proxy group found');
//       return res.status(404).json({ success: false, message: 'No active proxy group found for this user' });
//     }
//     console.log(`✅ Proxy group found with ID: ${groupId}`);

//     // Get proxy user info
//     console.log('👤 Fetching proxy user info...');
//     const proxyUserResult = await database.query(
//       `SELECT role_id, name FROM users WHERE id = ${proxy_id}`
//     );
//     if (proxyUserResult.length === 0) {
//       console.log('❌ Proxy user not found');
//       return res.status(404).json({ success: false, message: 'Proxy user not found' });
//     }
//     const proxyRoleId = proxyUserResult[0].role_id;
//     const proxyName = proxyUserResult[0].name;
//     const valid_vote = (proxyRoleId === 1 || proxyRoleId === 2) ? 1 : 0;
//     console.log(`👤 Proxy: ${proxyName} (Role ID: ${proxyRoleId}) — Valid vote: ${valid_vote}`);

//     // Validate target
//     console.log('🔍 Validating vote target...');
//     if (vote_type === 'employee') {
//       const employees = await database.query(
//         `SELECT id FROM employees WHERE id = ${target_id} AND is_eligible_for_voting = 1`
//       );
//       if (employees.length === 0) {
//         console.log('❌ Invalid or ineligible employee');
//         return res.status(404).json({ success: false, message: 'Invalid or ineligible employee' });
//       }
//       console.log(`✅ Voting for employee ID: ${employees[0].id}`);
//     } else {
//       const resolutions = await database.query(
//         `SELECT id, title FROM resolutions WHERE id = ${target_id} AND status = 'open_for_voting'`
//       );
//       if (resolutions.length === 0) {
//         console.log('❌ Invalid or closed resolution');
//         return res.status(404).json({ success: false, message: 'Invalid resolution or voting is closed' });
//       }
//       console.log(`✅ Voting for resolution: ${resolutions[0].title}`);
//     }

//     // Cast votes
//     console.log('🗳️ Starting vote casting for delegators...');
//     let successCount = 0;
//     const failedVotes = [];
//     const votedMembers = [];

//     for (const delegator_id of delegator_ids) {
//       try {
//         const memberInfo = await database.query(
//           `SELECT name FROM users WHERE id = ${delegator_id}`
//         );
//         const memberName = memberInfo[0]?.name || 'Unknown';
//         console.log(`🔍 Processing delegator: ${memberName} (ID: ${delegator_id})`);

//         const memberCheck = await database.query(
//           `SELECT id FROM proxy_group_members WHERE group_id = ${groupId} AND member_id = ${delegator_id}`
//         );
//         if (memberCheck.length === 0) {
//           console.log(`⚠️ Skipping ${memberName} — not in proxy group`);
//           failedVotes.push(memberName);
//           continue;
//         }

//         const voteCheckSql = vote_type === 'employee'
//           ? `SELECT id FROM votes WHERE voter_id = ${delegator_id} AND employee_id = ${target_id}`
//           : `SELECT id FROM votes WHERE voter_id = ${delegator_id} AND resolution_id = ${target_id}`;
//         const existingVotes = await database.query(voteCheckSql);
//         if (existingVotes.length > 0) {
//           console.log(`⚠️ Skipping ${memberName} — already voted`);
//           failedVotes.push(memberName);
//           continue;
//         }

//         console.log(`🗳️ Casting vote for ${memberName}...`);
       

//         const insertSql = vote_type === 'resolution'
//         ? `
//           INSERT INTO votes (
//             voter_id, vote_type, resolution_id, vote_choice, comment, is_anonymous,
//             ip_address, user_agent, proxy_id, vote_method, created_at, valid_vote,
//             is_proxy_vote, group_id
//           )
//           VALUES (
//             ${delegator_id}, '${vote_type}', ${target_id},
//             ${vote_value ? `'${vote_value}'` : 'NULL'},
//             ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
//             1,
//             ${req.ip ? `'${req.ip}'` : 'NULL'},
//             ${req.get('User-Agent') ? `'${req.get('User-Agent').replace(/'/g, "''")}'` : 'NULL'},
//             ${proxy_id}, 'web', GETDATE(), ${valid_vote}, 1, ${groupId}
//           )
//         `
//         : `
//           INSERT INTO votes (
//             voter_id, vote_type, employee_id, comment, is_anonymous,
//             ip_address, user_agent, proxy_id, vote_method, created_at, valid_vote,
//             is_proxy_vote, group_id
//           )
//           VALUES (
//             ${delegator_id}, '${vote_type}', ${target_id},
//             ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
//             1,
//             ${req.ip ? `'${req.ip}'` : 'NULL'},
//             ${req.get('User-Agent') ? `'${req.get('User-Agent').replace(/'/g, "''")}'` : 'NULL'},
//             ${proxy_id}, 'web', GETDATE(), ${valid_vote}, 1, ${groupId}
//           )
//         `;

//         await database.query(insertSql);
//         console.log(`✅ Vote recorded for ${memberName}`);
//         successCount++;
//         votedMembers.push(memberName);

//       } catch (error) {
//         console.error(`❌ Error casting vote for delegator ${delegator_id}:`, error);
//         const memberInfo = await database.query(
//           `SELECT name FROM users WHERE id = ${delegator_id}`
//         ).catch(() => [{ name: 'Unknown' }]);
//         failedVotes.push(memberInfo[0]?.name || 'Unknown');
//       }
//     }

//     // Update vote count
//     if (successCount > 0) {
//       if (vote_type === 'employee') {
//         await database.query(
//           `UPDATE employees SET total_votes = total_votes + ${successCount}, updated_at = GETDATE() WHERE id = ${target_id}`
//         );
//         console.log(`📊 Updated vote count for employee ID: ${target_id} (+${successCount})`);
//       } else {
//         console.log(`📊 Updated vote count for resolution ID: ${target_id} (+${successCount})`);
//       }
//     }

//     console.log(`✅ Split vote process completed. Success: ${successCount}, Failed: ${failedVotes.length}`);

//     res.json({ 
//       success: true, 
//       message: `Successfully cast ${successCount} split proxy vote${successCount !== 1 ? 's' : ''}`,
//       successCount,
//       failedVotes: failedVotes.length > 0 ? failedVotes : undefined,
//       votedMembers
//     });

//   } catch (error) {
//     console.error('❌ Error casting split votes:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to cast split votes',
//       error: error.message 
//     });
//   }
// });

router.post('/split-vote', async (req, res) => {
  try {
    const { proxy_id, delegator_ids, vote_type, employee_id, resolution_id, vote_value, comment } = req.body;

    console.log('📥 Received split vote request:', {
      proxy_id,
      delegator_ids,
      vote_type,
      employee_id,
      resolution_id,
      vote_value,
      comment
    });

    // Validate input
    console.log('🔍 Validating input...');
    if (!delegator_ids || !Array.isArray(delegator_ids) || delegator_ids.length === 0) {
      console.log('❌ Invalid delegator_ids');
      return res.status(400).json({ success: false, message: 'Invalid delegator IDs: must be a non-empty array' });
    }

    if (!vote_type || (vote_type !== 'employee' && vote_type !== 'resolution')) {
      console.log('❌ Invalid vote_type');
      return res.status(400).json({ success: false, message: 'Invalid vote type: must be "employee" or "resolution"' });
    }

    const target_id = vote_type === 'employee' ? employee_id : resolution_id;
    if (!target_id) {
      console.log('❌ Missing target_id');
      return res.status(400).json({ success: false, message: `Missing ${vote_type}_id` });
    }

    // Verify token
    console.log('🔐 Verifying token...');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const decodedToken = decodeJWT(token);
    const myId = decodedToken?.id;
    if (!myId) {
      console.log('❌ Invalid token');
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }

    // Get proxy group
    console.log('🔗 Fetching proxy group...');
    const proxyGroupResult = await database.query(
      `SELECT id FROM proxy_groups WHERE principal_id = ${proxy_id}`
    );
    const groupId = proxyGroupResult.length > 0 ? proxyGroupResult[0].id : null;

    if (!groupId) {
      console.log('❌ No proxy group found');
      return res.status(404).json({ success: false, message: 'No active proxy group found for this user' });
    }
    console.log(`✅ Proxy group found with ID: ${groupId}`);

    // Get proxy user info
    console.log('👤 Fetching proxy user info...');
    const proxyUserResult = await database.query(
      `SELECT role_id, name FROM users WHERE id = ${proxy_id}`
    );
    if (proxyUserResult.length === 0) {
      console.log('❌ Proxy user not found');
      return res.status(404).json({ success: false, message: 'Proxy user not found' });
    }
    const proxyRoleId = proxyUserResult[0].role_id;
    const proxyName = proxyUserResult[0].name;
    const valid_vote = (proxyRoleId === 1 || proxyRoleId === 2) ? 1 : 0;
    console.log(`👤 Proxy: ${proxyName} (Role ID: ${proxyRoleId}) — Valid vote: ${valid_vote}`);

    // Validate target
    console.log('🔍 Validating vote target...');
    if (vote_type === 'employee') {
      const employees = await database.query(
        `SELECT id FROM employees WHERE id = ${target_id} AND is_eligible_for_voting = 1`
      );
      if (employees.length === 0) {
        console.log('❌ Invalid or ineligible employee');
        return res.status(404).json({ success: false, message: 'Invalid or ineligible employee' });
      }
      console.log(`✅ Voting for employee ID: ${employees[0].id}`);
    } else {
      const resolutions = await database.query(
        `SELECT id, title FROM resolutions WHERE id = ${target_id} AND status = 'open_for_voting'`
      );
      if (resolutions.length === 0) {
        console.log('❌ Invalid or closed resolution');
        return res.status(404).json({ success: false, message: 'Invalid resolution or voting is closed' });
      }
      console.log(`✅ Voting for resolution: ${resolutions[0].title}`);
    }

    // Cast votes
    console.log('🗳️ Starting vote casting for delegators...');
    let successCount = 0;
    const failedVotes = [];
    const votedMembers = [];

    for (const delegator_id of delegator_ids) {
      try {
        const memberInfo = await database.query(
          `SELECT name FROM users WHERE id = ${delegator_id}`
        );
        const memberName = memberInfo[0]?.name || 'Unknown';
        console.log(`🔍 Processing delegator: ${memberName} (ID: ${delegator_id})`);

        // Check if member is in proxy group
        const memberCheck = await database.query(
          `SELECT id, appointment_type FROM proxy_group_members 
           WHERE group_id = ${groupId} AND member_id = ${delegator_id}`
        );
        if (memberCheck.length === 0) {
          console.log(`⚠️ Skipping ${memberName} — not in proxy group`);
          failedVotes.push({ name: memberName, reason: 'Not in proxy group' });
          continue;
        }

        const proxyMemberId = memberCheck[0].id;
        const appointmentType = memberCheck[0].appointment_type;

        // NEW: Check allowed_candidates for INSTRUCTIONAL proxies when voting for employees
        if (vote_type === 'employee' && appointmentType === 'INSTRUCTIONAL') {
          const allowedCheck = await database.query(
            `SELECT id FROM proxy_member_allowed_candidates 
             WHERE proxy_member_id = ${proxyMemberId} AND employee_id = ${target_id}`
          );
          
          if (allowedCheck.length === 0) {
            console.log(`⚠️ Skipping ${memberName} — employee ${target_id} not in allowed candidates list`);
            failedVotes.push({ name: memberName, reason: 'Employee not in allowed candidates' });
            continue;
          }
          console.log(`✅ ${memberName} is authorized to vote for this employee`);
        }

        // Check if already voted
        const voteCheckSql = vote_type === 'employee'
          ? `SELECT id FROM votes WHERE voter_id = ${delegator_id} AND employee_id = ${target_id}`
          : `SELECT id FROM votes WHERE voter_id = ${delegator_id} AND resolution_id = ${target_id}`;
        const existingVotes = await database.query(voteCheckSql);
        if (existingVotes.length > 0) {
          console.log(`⚠️ Skipping ${memberName} — already voted`);
          failedVotes.push({ name: memberName, reason: 'Already voted' });
          continue;
        }

        console.log(`🗳️ Casting vote for ${memberName}...`);

        const insertSql = vote_type === 'resolution'
        ? `
          INSERT INTO votes (
            voter_id, vote_type, resolution_id, vote_choice, comment, is_anonymous,
            ip_address, user_agent, proxy_id, vote_method, created_at, valid_vote,
            is_proxy_vote, group_id
          )
          VALUES (
            ${delegator_id}, '${vote_type}', ${target_id},
            ${vote_value ? `'${vote_value}'` : 'NULL'},
            ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
            1,
            ${req.ip ? `'${req.ip}'` : 'NULL'},
            ${req.get('User-Agent') ? `'${req.get('User-Agent').replace(/'/g, "''")}'` : 'NULL'},
            ${proxy_id}, 'web', GETDATE(), ${valid_vote}, 1, ${groupId}
          )
        `
        : `
          INSERT INTO votes (
            voter_id, vote_type, employee_id, comment, is_anonymous,
            ip_address, user_agent, proxy_id, vote_method, created_at, valid_vote,
            is_proxy_vote, group_id
          )
          VALUES (
            ${delegator_id}, '${vote_type}', ${target_id},
            ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
            1,
            ${req.ip ? `'${req.ip}'` : 'NULL'},
            ${req.get('User-Agent') ? `'${req.get('User-Agent').replace(/'/g, "''")}'` : 'NULL'},
            ${proxy_id}, 'web', GETDATE(), ${valid_vote}, 1, ${groupId}
          )
        `;

        await database.query(insertSql);
        console.log(`✅ Vote recorded for ${memberName}`);
        successCount++;
        votedMembers.push(memberName);

      } catch (error) {
        console.error(`❌ Error casting vote for delegator ${delegator_id}:`, error);
        const memberInfo = await database.query(
          `SELECT name FROM users WHERE id = ${delegator_id}`
        ).catch(() => [{ name: 'Unknown' }]);
        failedVotes.push({ name: memberInfo[0]?.name || 'Unknown', reason: 'Database error' });
      }
    }

    // Update vote count
    if (successCount > 0) {
      if (vote_type === 'employee') {
        await database.query(
          `UPDATE employees SET total_votes = total_votes + ${successCount}, updated_at = GETDATE() WHERE id = ${target_id}`
        );
        console.log(`📊 Updated vote count for employee ID: ${target_id} (+${successCount})`);
      } else {
        console.log(`📊 Updated vote count for resolution ID: ${target_id} (+${successCount})`);
      }
    }

    console.log(`✅ Split vote process completed. Success: ${successCount}, Failed: ${failedVotes.length}`);

    res.json({ 
      success: true, 
      message: `Successfully cast ${successCount} split proxy vote${successCount !== 1 ? 's' : ''}`,
      successCount,
      failedVotes: failedVotes.length > 0 ? failedVotes.map(f => `${f.name} (${f.reason})`) : undefined,
      votedMembers
    });

  } catch (error) {
    console.error('❌ Error casting split votes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cast split votes',
      error: error.message 
    });
  }
});

// EDIT SPLIT PROXY VOTES
router.put('/split-vote/edit', async (req, res) => {
  try {
    const { proxy_id, delegator_ids, vote_type, employee_id, resolution_id, comment, vote_choice } = req.body;

    if (!delegator_ids || !Array.isArray(delegator_ids)) {
      return res.status(400).json({ success: false, message: 'Invalid delegator IDs' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const decodedToken = decodeJWT(token);
    if (!decodedToken?.id || decodedToken.id != proxy_id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check timer
    // const timerResult = await database.query(`SELECT active, start_time, end_time FROM agm_timer WHERE id = 1`);
    // if (timerResult.length === 0 || !timerResult[0].active) {
    //   return res.status(403).json({ success: false, message: 'Voting period is not active' });
    // }

    // const timer = timerResult[0];
    // const now = new Date();
    // const [startH, startM] = timer.start_time.split(':').map(Number);
    // const [endH, endM] = timer.end_time.split(':').map(Number);
    // const votingStart = new Date(now);
    // const votingEnd = new Date(now);
    // votingStart.setHours(startH, startM, 0, 0);
    // votingEnd.setHours(endH, endM, 0, 0);

    // if (now < votingStart || now > votingEnd) {
    //   return res.status(403).json({ success: false, message: 'Voting period has ended' });
    // }

    const target_id = vote_type === 'employee' ? employee_id : resolution_id;
    let successCount = 0;

    for (const delegator_id of delegator_ids) {
      try {
        const updateFields = [];
        if (comment !== undefined) {
          updateFields.push(`comment = ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'}`);
        }
        if (vote_choice !== undefined && vote_type === 'resolution') {
          updateFields.push(`vote_choice = ${vote_choice ? `'${vote_choice}'` : 'NULL'}`);
        }
        updateFields.push('updated_at = GETDATE()');

        const updateSql = vote_type === 'employee'
          ? `UPDATE votes SET ${updateFields.join(', ')} WHERE voter_id = ${delegator_id} AND employee_id = ${target_id} AND proxy_id = ${proxy_id}`
          : `UPDATE votes SET ${updateFields.join(', ')} WHERE voter_id = ${delegator_id} AND resolution_id = ${target_id} AND proxy_id = ${proxy_id}`;

        await database.query(updateSql);
        successCount++;
      } catch (error) {
        console.error('Error updating vote:', error);
      }
    }

    res.json({ success: true, message: `Updated ${successCount} votes`, successCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to edit votes' });
  }
});

// REMOVE SPLIT PROXY VOTES
router.delete('/split-vote', async (req, res) => {
  try {
    const { proxy_id, delegator_ids, vote_type, employee_id, resolution_id } = req.body;

    if (!Array.isArray(delegator_ids)) {
      return res.status(400).json({ success: false, message: 'Invalid delegator IDs' });
    }

    const target_id = vote_type === 'employee' ? employee_id : resolution_id;
    let successCount = 0;

    for (const delegator_id of delegator_ids) {
      try {
        const deleteSql = vote_type === 'employee'
          ? `DELETE FROM votes WHERE voter_id = ${delegator_id} AND employee_id = ${target_id} AND proxy_id = ${proxy_id}`
          : `DELETE FROM votes WHERE voter_id = ${delegator_id} AND resolution_id = ${target_id} AND proxy_id = ${proxy_id}`;

        await database.query(deleteSql);
        successCount++;
      } catch (error) {
        console.error(`Error removing vote for delegator ${delegator_id}:`, error);
      }
    }

    if (successCount > 0 && vote_type === 'employee') {
      const updateSql = `
        UPDATE employees
        SET total_votes = CASE
          WHEN total_votes >= ${successCount} THEN total_votes - ${successCount}
          ELSE 0
        END,
        updated_at = GETDATE()
        WHERE id = ${target_id}
      `;
      await database.query(updateSql);
    }

    res.json({ success: true, message: `Removed ${successCount} votes`, removedCount: successCount });
  } catch (error) {
    console.error('Vote removal failed:', error);
    res.status(500).json({ success: false, message: 'Failed to remove votes' });
  }
});



  // Get single employee with details - THIS MUST COME LAST
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

      // Get employee basic info
      const employee = await Employee.findById(parsedId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Get achievements and skills in parallel
      const [achievements, skills] = await Promise.all([
        Employee.getAchievements(parsedId),
        Employee.getSkills(parsedId)
      ]);

      // Check if user has voted
      // const token = req.headers.authorization?.split(' ')[1];
      // console.log("Token:", token);
      // const decodedToken = decodeJWT(token);
      // const myId = decodedToken.id;

      // const hasVoted = myId ? await Vote.hasUserVoted(myId, 'employee', parsedId) : false;

      // console.log("Employee Data vote:", hasVoted);

      const transformedEmployee = {
        id: employee.id.toString(),
        name: employee.name,
        position: employee.position,
        department: employee.department,
        avatar: employee.avatar,
        bio: employee.bio,
        yearsOfService: employee.years_of_service,
        votes: employee.total_votes,
        achievements: achievements.map(ach => ach.title || ach.description || 'Achievement'),
        skills: skills.map(skill => skill.skill_name || skill.name || 'Skill'),
        // hasVoted: hasVoted,
      };

      console.log("Transformed Employee:", transformedEmployee);

      res.json({
        success: true,
        data: transformedEmployee
      });

    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employee'
      });
    }
  });

// Register new employee
// router.post('/register', async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     const decodedToken = decodeJWT(token);
//     const userId = decodedToken?.id || decodedToken?.userId;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized: Invalid token'
//       });
//     }

//     const { position, department_id, bio, hire_date, salary, manager_id, skills, achievements } = req.body;

//     // Validate required fields
//     if (!position || !department_id || !hire_date) {
//       return res.status(400).json({
//         success: false,
//         message: 'Position, department, and hire date are required'
//       });
//     }

//     // Check if user is already registered as employee
//     const existingEmployee = await Employee.checkEmployeeStatus(userId);
//     if (existingEmployee && existingEmployee.exists_in_employees) {
//       return res.status(409).json({
//         success: false,
//         message: 'User is already registered as an employee'
//       });
//     }

//     const employeeData = {
//       position,
//       department_id: parseInt(department_id),
//       bio,
//       hire_date,
//       salary: salary ? parseFloat(salary) : null,
//       manager_id: manager_id ? parseInt(manager_id) : null,
//       skills: skills || [],
//       achievements: achievements || []
//     };

//     const result = await Employee.registerEmployee(userId, employeeData);

//     res.status(201).json({
//       success: true,
//       message: 'Employee registered successfully',
//       data: result
//     });

//   } catch (error) {
//     console.error('Error registering employee:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to register employee'
//     });
//   }
// });

router.post('/register', async (req, res) => {
  try {
    console.log('📥 Incoming registration payload:', JSON.stringify(req.body, null, 2));

    const {
      title,
      initials,
      id_number,
      id_type,
      name,
      lastname,
      email,
      phone,
      date_of_birth,
      street_address,
      city,
      province,
      postal_code,
      country,
      bio,
      skills,
      achievements,
      good_standing_id_number,
      proxy_vote_form
    } = req.body;

    // ✅ Validate required fields
    if (!name || !lastname || !email || !id_number || !id_type) {
      return res.status(400).json({
        success: false,
        message: 'Name, lastname, email, ID number, and ID type are required'
      });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    // ✅ Generate secure password
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    console.log('🔐 Generated password:', password);

    // ✅ Create user
    const newUserId = await User.create({
      title,
      initials,
      id_number,
      name,
      lastname,
      email,
      password,
      role_id: 3,
      good_standing_id_number,
      proxy_vote_form,
      date_of_birth, // varchar(10)
      phone          // varchar(10)
    });

    // ✅ Insert address into user_address table
    await Employee.insertAddress(newUserId, {
      street_address,
      city,
      province,
      postal_code,
      country
    });

    // ✅ Prepare employee data
    const employeeData = {
      id_type,
      bio,
      skills: skills || [],
      achievements: achievements || []
    };

    // ✅ Register employee profile
    const employeeProfile = await Employee.registerEmployee(newUserId, employeeData);

    // ✅ Send welcome email
    const emailResult = await emailService.sendRegisterEmail(email, name);
    if (!emailResult.success) {
      console.error('⚠️ Failed to send welcome email:', emailResult.error);
    }

    res.status(201).json({
      success: true,
      message: `User registered successfully! Welcome email sent to ${email}`,
      data: {
        user_id: newUserId,
        employee: employeeProfile
      }
    });

  } catch (error) {
    console.error('❌ Error registering user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register user'
    });
  }
});
``

// ⚠️ PARAMETERIZED ROUTES LAST - Any routes like /:employeeId MUST come AFTER specific routes
router.get('/:employeeId', async (req, res) => {
  const { employeeId } = req.params;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: 'Employee ID is required'
    });
  }

  try {
    const employee = await Employee.getEmployeeByUserId(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error(' Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee'
    });
  }
});





// Register new employee
// router.post('/register', async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     const decodedToken = decodeJWT(token);
//     const userId = decodedToken?.id || decodedToken?.userId;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized: Invalid token'
//       });
//     }

//     const { position, department_id, bio, hire_date, salary, manager_id, skills, achievements } = req.body;

//     // Validate required fields
//     if (!position || !department_id || !hire_date) {
//       return res.status(400).json({
//         success: false,
//         message: 'Position, department, and hire date are required'
//       });
//     }

//     // Check if user is already registered as employee
//     const existingEmployee = await Employee.checkEmployeeStatus(userId);
//     if (existingEmployee && existingEmployee.exists_in_employees) {
//       return res.status(409).json({
//         success: false,
//         message: 'User is already registered as an employee'
//       });
//     }

//     const employeeData = {
//       position,
//       department_id: parseInt(department_id),
//       bio,
//       hire_date,
//       salary: salary ? parseFloat(salary) : null,
//       manager_id: manager_id ? parseInt(manager_id) : null,
//       skills: skills || [],
//       achievements: achievements || []
//     };

//     const result = await Employee.registerEmployee(userId, employeeData);

//     res.status(201).json({
//       success: true,
//       message: 'Employee registered successfully',
//       data: result
//     });

//   } catch (error) {
//     console.error('Error registering employee:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to register employee'
//     });
//   }
// });

// Check employee status for a user
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const employeeStatus = await Employee.checkEmployeeStatus(userId);
    console.log('Employee status:', employeeStatus);

    // If null or undefined, treat as not found
    if (employeeStatus == null) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build issues array based on emailIsBlank
    const issues = [];
    if (employeeStatus.emailIsBlank) {
      issues.push('Employee login record exists but email is missing');
    }

    res.json({
      success: true,
      data: {
        ...employeeStatus,
        // hasIssues: issues.length > 0,
        issues
      }
    });

  } catch (error) {
    console.error('Employee status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while checking employee status'
    });
  }
});

// Get employee details by user ID
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const employee = await Employee.getEmployeeByUserId(userId);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching employee'
    });
  }
});

// Get employee login details by user ID
router.get('/login/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const employeeLogin = await Employee.getEmployeeLoginByUserId(userId);
    
    if (!employeeLogin) {
      return res.status(404).json({
        success: false,
        message: 'Employee login record not found'
      });
    }

    res.json({
      success: true,
      data: employeeLogin
    });

  } catch (error) {
    console.error('Get employee login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching employee login'
    });
  }
});

// router.post('/proxy-forms-details', async (req, res) => {
//     const formData = req.body;
//     try {
//         const query = `
//             INSERT INTO proxy_forms (
//                 auth_user_id, employee_id, title, initials, surname, full_names, membership_number,
//                 id_passport_number, appointment_type, proxy_full_names, proxy_surname,
//                 trustee_remuneration, remuneration_policy, auditors_appointment, agm_motions,
//                 candidate1, candidate2, candidate3, signed_at, signature_date, proxy_membership_number,
//                 created_by
//             ) VALUES (
//                 @auth_user_id, @employee_id, @title, @initials, @surname, @full_names, @membership_number,
//                 @id_passport_number, @appointment_type, @proxy_full_names, @proxy_surname,
//                 @trustee_remuneration, @remuneration_policy, @auditors_appointment, @agm_motions,
//                 @candidate1, @candidate2, @candidate3, @signed_at, @signature_date, @proxy_membership_number,
//                 @created_by
//             );
//         `;
//         await database.query(query, {
//             auth_user_id: formData.auth_user_id,
//             employee_id: formData.employee_id,
//             title: formData.title,
//             initials: formData.initials,
//             surname: formData.surname,
//             full_names: formData.full_names,
//             membership_number: formData.membership_number,
//             id_passport_number: formData.id_passport_number,
//             appointment_type: formData.appointment_type,
//             proxy_full_names: formData.proxy_full_names,
//             proxy_surname: formData.proxy_surname,
//             trustee_remuneration: formData.trustee_remuneration,
//             remuneration_policy: formData.remuneration_policy,
//             auditors_appointment: formData.auditors_appointment,
//             agm_motions: formData.agm_motions,
//             candidate1: formData.candidate1,
//             candidate2: formData.candidate2,
//             candidate3: formData.candidate3,
//             signed_at: formData.signed_at,
//             signature_date: formData.signature_date,
//             proxy_membership_number: formData.proxy_membership_number,
//             created_by: formData.created_by
//         });
//         res.status(201).json({ message: 'Proxy form created successfully' });
//     } catch (error) {
//         console.error('Error creating proxy form:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// router.get('/proxy-forms-details', async (req, res) => {
//     const { status } = req.query;
//     try {
//         const query = `
//             SELECT pf.*, u.name AS user_name, e.position AS employee_position
//             FROM proxy_forms pf
//             LEFT JOIN users u ON pf.auth_user_id = u.id
//             LEFT JOIN employees e ON pf.employee_id = e.id
//             ${status ? 'WHERE pf.approval_status = @status' : ''}
//         `;
//         const result = await database.query(query, { status });
//         res.json(result.recordset);
//     } catch (error) {
//         console.error('Error fetching proxy forms:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

router.post('/proxy-groups', async (req, res) => {
    const { group_name, principal_employee_id, members, created_by } = req.body;

    try {
        // Start a transaction
        // await database.beginTransaction();

        // Insert the proxy group
        const groupQuery = `
            INSERT INTO proxy_group (group_name, principal_employee_id, created_by)
            OUTPUT INSERTED.id
            VALUES (@group_name, @principal_employee_id, @created_by)
        `;
        const groupResult = await database.query(groupQuery, {
            group_name,
            principal_employee_id,
            created_by
        });
        const groupId = groupResult.recordset[0].id;

        // Insert the members
        const memberQuery = `
            INSERT INTO proxy_group_member (group_id, employee_id, role)
            VALUES (@group_id, @employee_id, @role)
        `;
        for (const member of members) {
            await database.query(memberQuery, {
                group_id: groupId,
                employee_id: member.employee_id,
                role: member.role
            });
        }

        // Commit the transaction
        await database.commitTransaction();

        res.status(201).json({ message: 'Proxy group created successfully', groupId });
    } catch (error) {
        console.error('Error creating proxy group:', error);
        // await database.rollbackTransaction();
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/proxy-groups', async (req, res) => {
    try {
        const query = `
            SELECT
                pg.id AS group_id,
                pg.group_name,
                pg.principal_employee_id,
                e.name AS principal_name,
                pg.created_at,
                pg.updated_at,
                pgm.employee_id,
                em.name AS member_name,
                pgm.role
            FROM proxy_group pg
            LEFT JOIN employees e ON pg.principal_employee_id = e.id
            LEFT JOIN proxy_group_member pgm ON pg.id = pgm.group_id
            LEFT JOIN employees em ON pgm.employee_id = em.id
        `;
        const result = await database.query(query);

        // Group the results by group_id
        const groups = {};
        result.recordset.forEach(row => {
            if (!groups[row.group_id]) {
                groups[row.group_id] = {
                    group_id: row.group_id,
                    group_name: row.group_name,
                    principal: {
                        employee_id: row.principal_employee_id,
                        name: row.principal_name
                    },
                    members: [],
                    created_at: row.created_at,
                    updated_at: row.updated_at
                };
            }
            if (row.employee_id) {
                groups[row.group_id].members.push({
                    employee_id: row.employee_id,
                    name: row.member_name,
                    role: row.role
                });
            }
        });

        res.json(Object.values(groups));
    } catch (error) {
        console.error('Error fetching proxy groups:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/proxy-forms (list all forms for current user)
// router.get('/registration-data-forms', async (req, res) => {
//   try {
//     const userId = req.query.userId || req.headers['x-user-id'];

//     if (!userId || isNaN(parseInt(userId))) {
//       console.error(' Invalid or missing userId:', userId);
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid or missing userId in request',
//       });
//     }

//     console.log(`Fetching proxy forms for userId: ${userId}`);
//     const forms = await Employee.getProxyFormsByUserId(userId);

//     res.json({
//       success: true,
//       data: forms,
//     });
//   } catch (error) {
//     console.error(' Error fetching proxy forms:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch proxy forms',
//       error: error.message,
//     });
//   }
// });

// POST /api/proxy-forms (create or update proxy form)
router.post('/registration-data-forms', async (req, res) => {
  const transaction = new sql.Transaction();

  try {
    const { formId, formData, submittedAt } = req.body;
    const userId = req.body.userId || req.headers['x-user-id'] || 1; // Default to 1 for testing

    const pool = await getConnection();
    // await transaction.begin(pool);

    // Check if form exists
    const checkResult = await transaction.request()
      .input('formId', sql.NVarChar(100), formId)
      .query('SELECT id FROM proxy_forms WHERE form_id = @formId');

    let proxyFormId;

    if (checkResult.recordset.length > 0) {
      // UPDATE existing form
      proxyFormId = checkResult.recordset[0].id;

      await transaction.request()
        .input('id', sql.Int, proxyFormId)
        .input('title', sql.NVarChar(10), formData.title)
        .input('initials', sql.NVarChar(20), formData.initials)
        .input('surname', sql.NVarChar(100), formData.surname)
        .input('fullNames', sql.NVarChar(200), formData.fullNames)
        .input('membershipNumber', sql.NVarChar(50), formData.membershipNumber)
        .input('idPassportNumber', sql.NVarChar(50), formData.idPassportNumber)
        .input('appointmentType', sql.NVarChar(20), formData.appointmentType)
        .input('proxyFullNames', sql.NVarChar(200), formData.proxyFullNames)
        .input('proxySurname', sql.NVarChar(100), formData.proxySurname)
        .input('trusteeRemuneration', sql.NVarChar(10), formData.trusteeRemuneration || null)
        .input('remunerationPolicy', sql.NVarChar(10), formData.remunerationPolicy || null)
        .input('auditorsAppointment', sql.NVarChar(10), formData.auditorsAppointment || null)
        .input('agmMotions', sql.NVarChar(10), formData.agmMotions || null)
        .input('candidate1', sql.NVarChar(200), formData.candidate1 || null)
        .input('candidate2', sql.NVarChar(200), formData.candidate2 || null)
        .input('candidate3', sql.NVarChar(200), formData.candidate3 || null)
        .input('signedAt', sql.NVarChar(200), formData.signedAt)
        .input('signatureDate', sql.Date, formData.signatureDate)
        .input('proxyInitials', sql.NVarChar(20), formData.proxyInitials || null)
        .input('proxyFullNamesConfirm', sql.NVarChar(200), formData.proxyFullNamesConfirm || null)
        .input('proxySurnameConfirm', sql.NVarChar(100), formData.proxySurnameConfirm || null)
        .input('proxyMembershipNumber', sql.NVarChar(50), formData.proxyMembershipNumber || null)
        .input('proxyIdPassportNumber', sql.NVarChar(50), formData.proxyIdPassportNumber || null)
        .input('status', sql.NVarChar(20), submittedAt ? 'submitted' : 'draft')
        .input('submittedAt', sql.DateTime2, submittedAt || null)
        .input('updatedAt', sql.DateTime2, new Date())
        .input('updatedatabasey', sql.Int, userId)
        .query(`
          UPDATE proxy_forms SET
            title = @title,
            initials = @initials,
            surname = @surname,
            full_names = @fullNames,
            membership_number = @membershipNumber,
            id_passport_number = @idPassportNumber,
            appointment_type = @appointmentType,
            proxy_full_names = @proxyFullNames,
            proxy_surname = @proxySurname,
            trustee_remuneration = @trusteeRemuneration,
            remuneration_policy = @remunerationPolicy,
            auditors_appointment = @auditorsAppointment,
            agm_motions = @agmMotions,
            candidate1 = @candidate1,
            candidate2 = @candidate2,
            candidate3 = @candidate3,
            signed_at = @signedAt,
            signature_date = @signatureDate,
            proxy_initials = @proxyInitials,
            proxy_full_names_confirm = @proxyFullNamesConfirm,
            proxy_surname_confirm = @proxySurnameConfirm,
            proxy_membership_number = @proxyMembershipNumber,
            proxy_id_passport_number = @proxyIdPassportNumber,
            status = @status,
            submitted_at = @submittedAt,
            updated_at = @updatedAt,
            updated_by = @updatedatabasey
          WHERE id = @id
        `);
    } else {
      // INSERT new form
      const insertResult = await transaction.request()
        .input('formId', sql.NVarChar(100), formId)
        .input('userId', sql.Int, userId)
        .input('title', sql.NVarChar(10), formData.title)
        .input('initials', sql.NVarChar(20), formData.initials)
        .input('surname', sql.NVarChar(100), formData.surname)
        .input('fullNames', sql.NVarChar(200), formData.fullNames)
        .input('membershipNumber', sql.NVarChar(50), formData.membershipNumber)
        .input('idPassportNumber', sql.NVarChar(50), formData.idPassportNumber)
        .input('appointmentType', sql.NVarChar(20), formData.appointmentType)
        .input('proxyFullNames', sql.NVarChar(200), formData.proxyFullNames)
        .input('proxySurname', sql.NVarChar(100), formData.proxySurname)
        .input('trusteeRemuneration', sql.NVarChar(10), formData.trusteeRemuneration || null)
        .input('remunerationPolicy', sql.NVarChar(10), formData.remunerationPolicy || null)
        .input('auditorsAppointment', sql.NVarChar(10), formData.auditorsAppointment || null)
        .input('agmMotions', sql.NVarChar(10), formData.agmMotions || null)
        .input('candidate1', sql.NVarChar(200), formData.candidate1 || null)
        .input('candidate2', sql.NVarChar(200), formData.candidate2 || null)
        .input('candidate3', sql.NVarChar(200), formData.candidate3 || null)
        .input('signedAt', sql.NVarChar(200), formData.signedAt)
        .input('signatureDate', sql.Date, formData.signatureDate)
        .input('proxyInitials', sql.NVarChar(20), formData.proxyInitials || null)
        .input('proxyFullNamesConfirm', sql.NVarChar(200), formData.proxyFullNamesConfirm || null)
        .input('proxySurnameConfirm', sql.NVarChar(100), formData.proxySurnameConfirm || null)
        .input('proxyMembershipNumber', sql.NVarChar(50), formData.proxyMembershipNumber || null)
        .input('proxyIdPassportNumber', sql.NVarChar(50), formData.proxyIdPassportNumber || null)
        .input('status', sql.NVarChar(20), submittedAt ? 'submitted' : 'draft')
        .input('submittedAt', sql.DateTime2, submittedAt || null)
        .input('createdatabasey', sql.Int, userId)
        .query(`
          INSERT INTO proxy_forms (
            form_id, user_id, title, initials, surname, full_names,
            membership_number, id_passport_number, appointment_type,
            proxy_full_names, proxy_surname, trustee_remuneration,
            remuneration_policy, auditors_appointment, agm_motions,
            candidate1, candidate2, candidate3, signed_at, signature_date,
            proxy_initials, proxy_full_names_confirm, proxy_surname_confirm,
            proxy_membership_number, proxy_id_passport_number,
            status, submitted_at, created_by
          ) VALUES (
            @formId, @userId, @title, @initials, @surname, @fullNames,
            @membershipNumber, @idPassportNumber, @appointmentType,
            @proxyFullNames, @proxySurname, @trusteeRemuneration,
            @remunerationPolicy, @auditorsAppointment, @agmMotions,
            @candidate1, @candidate2, @candidate3, @signedAt, @signatureDate,
            @proxyInitials, @proxyFullNamesConfirm, @proxySurnameConfirm,
            @proxyMembershipNumber, @proxyIdPassportNumber,
            @status, @submittedAt, @createdatabasey
          );
          SELECT SCOPE_IDENTITY() AS id;
        `);

      proxyFormId = insertResult.recordset[0].id;
    }

    // Handle proxy members
    if (formData.proxyMembers && Array.isArray(formData.proxyMembers)) {
      // Delete existing proxy members
      await transaction.request()
        .input('proxyFormId', sql.Int, proxyFormId)
        .query('DELETE FROM proxy_members WHERE proxy_form_id = @proxyFormId');

      // Insert new proxy members
      for (const memberName of formData.proxyMembers) {
        if (memberName && memberName.trim()) {
          await transaction.request()
            .input('proxyFormId', sql.Int, proxyFormId)
            .input('memberName', sql.NVarChar(200), memberName.trim())
            .query('INSERT INTO proxy_members (proxy_form_id, member_name) VALUES (@proxyFormId, @memberName)');
        }
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: submittedAt ? 'Form submitted successfully' : 'Form saved successfully',
      data: {
        id: proxyFormId,
        formId: formId
      }
    });
  } catch (error) {
    if (transaction._aborted === false) {
      // await transaction.rollback();
    }
    console.error(' Error saving proxy form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save proxy form',
      error: error.message
    });
  }
});

// GET /api/proxy-forms/:id (get single form by ID)
router.get('/registration-data-forms/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const formData = await Employee.getProxyFormById(id);

    if (!formData) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    const { form, proxyMembers } = formData;

    res.json({
      success: true,
      formData: {
        ...form,
        proxyMembers
      },
      submitted: form.status === 'submitted',
      status: form.status,
      submittedAt: form.submitted_at,
      createdAt: form.created_at,
      updatedAt: form.updated_at
    });
  } catch (error) {
    console.error(' Error fetching proxy form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proxy form',
      error: error.message
    });
  }
});

// GET /api/registration-data-forms/employees - Fetch all employees
router.get('/registration-data-forms/employees', async (req, res) => {
  try {
    const employees = await Employee.getAllEmployees();

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error(' Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
});

router.get('/registration-data-forms', async (req, res) => {
  try {
    const forms = await Employee.getAllProxy();

    const transformedForms = forms.map(form => ({
      id: form.id.toString(),
      formId: form.form_id,
      userId: form.user_id,
      title: form.title,
      initials: form.initials,
      surname: form.surname,
      fullNames: form.full_names,
      membershipNumber: form.membership_number,
      idPassportNumber: form.id_passport_number,
      appointmentType: form.appointment_type,
      proxy: {
        fullNames: form.proxy_full_names,
        surname: form.proxy_surname,
        initials: form.proxy_initials,
        confirmedFullNames: form.proxy_full_names_confirm,
        confirmedSurname: form.proxy_surname_confirm,
        membershipNumber: form.proxy_membership_number,
        idPassportNumber: form.proxy_id_passport_number
      },
      voting: {
        trusteeRemuneration: form.trustee_remuneration,
        remunerationPolicy: form.remuneration_policy,
        auditorsAppointment: form.auditors_appointment,
        agmMotions: form.agm_motions,
        candidates: [form.candidate1, form.candidate2, form.candidate3]
      },
      signedAt: form.signed_at,
      signatureDate: form.signature_date,
      status: form.status,
      submittedAt: form.submitted_at,
      createdAt: form.created_at,
      updatedAt: form.updated_at
    }));

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



export default router;