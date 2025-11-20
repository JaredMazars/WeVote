import database from "../config/database.js";

class Vote {
//     static async castVote(voteData) {
//     const { 
//         voter_id, 
//         vote_type, 
//         target_id,
//         vote_choice, // NEW: YES/NO/ABSTAIN
//         comment, 
//         is_anonymous = true, 
//         ip_address, 
//         user_agent, 
//         proxy_id, 
//         vote_method = 'web', 
//         phone_number, 
//         created_by 
//     } = voteData;

//     try {
//         // Check if user has already voted for this target
//         let checkSql, insertSql;

//         if (vote_type === 'employee') {
//             checkSql = `SELECT id FROM votes WHERE voter_id = ${voter_id} AND employee_id = ${target_id}`;
            
//             insertSql = `
//                 INSERT INTO votes (voter_id, vote_type, employee_id, vote_choice, comment, is_anonymous, ip_address, user_agent, proxy_id, vote_method, phone_number, created_by, created_at)
//                 VALUES (${voter_id}, '${vote_type}', ${target_id}, ${vote_choice ? `'${vote_choice}'` : 'NULL'}, ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'}, ${is_anonymous ? 1 : 0}, ${ip_address ? `'${ip_address}'` : 'NULL'}, ${user_agent ? `'${user_agent.replace(/'/g, "''")}'` : 'NULL'}, ${proxy_id || 'NULL'}, '${vote_method}', ${phone_number ? `'${phone_number}'` : 'NULL'}, ${created_by ? `'${created_by}'` : 'NULL'}, GETDATE())
//             `;
            
//         } else if (vote_type === 'resolution') {
//             checkSql = `SELECT id FROM votes WHERE voter_id = ${voter_id} AND resolution_id = ${target_id}`;
            
//             insertSql = `
//                 INSERT INTO votes (voter_id, vote_type, resolution_id, vote_choice, comment, is_anonymous, ip_address, user_agent, proxy_id, vote_method, phone_number, created_by, created_at)
//                 VALUES (${voter_id}, '${vote_type}', ${target_id}, ${vote_choice ? `'${vote_choice}'` : 'NULL'}, ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'}, ${is_anonymous ? 1 : 0}, ${ip_address ? `'${ip_address}'` : 'NULL'}, ${user_agent ? `'${user_agent.replace(/'/g, "''")}'` : 'NULL'}, ${proxy_id || 'NULL'}, '${vote_method}', ${phone_number ? `'${phone_number}'` : 'NULL'}, ${created_by ? `'${created_by}'` : 'NULL'}, GETDATE())
//             `;
            
//         } else {
//             throw new Error('Invalid vote type');
//         }

//         // Check for existing vote
//         const existingVotes = await database.query(checkSql);
//         if (existingVotes.length > 0) {
//             throw new Error(`You have already voted for this ${vote_type}`);
//         }

//         // Validate target exists
//         if (vote_type === 'employee') {
//             const employees = await database.query(
//                 `SELECT id FROM employees WHERE id = ${target_id} AND is_eligible_for_voting = 1`
//             );
//             if (employees.length === 0) {
//                 throw new Error('Invalid or ineligible employee');
//             }
//         } else if (vote_type === 'resolution') {
//             const resolutions = await database.query(
//                 `SELECT id FROM resolutions WHERE id = ${target_id} AND status = 'open_for_voting'`
//             );
//             if (resolutions.length === 0) {
//                 throw new Error('Invalid resolution or voting is closed');
//             }
//         }

//         // Insert vote
//         await database.query(insertSql);
        
//         // Update vote count for employee
//         if (vote_type === 'employee') {
//             const updateCountSql = `
//                 UPDATE employees 
//                 SET total_votes = total_votes + 1, updated_at = GETDATE()
//                 WHERE id = ${target_id}
//             `;
//             await database.query(updateCountSql);
//         }
        
//         return true;

//     } catch (error) {
//         console.error('Error in castVote:', error);
//         throw error;
//     }
// }

  // static async castVote(voteData) {
  //     const {
  //       voter_id,
  //       vote_type,
  //       target_id,
  //       vote_choice,
  //       comment,
  //       is_anonymous = true,
  //       ip_address,
  //       user_agent,
  //       proxy_id,
  //       vote_method = 'web',
  //       phone_number,
  //       created_by
  //     } = voteData;

  //     try {
  //     // Get voter's role
  //     const userResult = await database.query(
  //       `SELECT role_id FROM users WHERE id = ${voter_id}`
  //     );

  //     if (userResult.length === 0) {
  //       throw new Error('Voter not found');
        
  //     }

  //     console.log('Voter not found for ID:', userResult[0]);
  //     console.log('Voter not found for ID2:', userResult[0].role_id);


  //     const role_id = userResult[0].role_id;
  //     const valid_vote = (role_id === 1 || role_id === 2) ? 1 : 0;

  //     // 🔁 Check if user already voted
  //     let checkSql, insertSql;

  //     if (vote_type === 'employee') {
  //       checkSql = `SELECT id FROM votes WHERE voter_id = ${voter_id} AND employee_id = ${target_id}`;

  //       insertSql = `
  //         INSERT INTO votes (
  //           voter_id, vote_type, employee_id, vote_choice, comment, is_anonymous,
  //           ip_address, user_agent, proxy_id, vote_method, phone_number,
  //           created_by, created_at, valid_vote
  //         )
  //         VALUES (
  //           ${voter_id},
  //           '${vote_type}',
  //           ${target_id},
  //           ${vote_choice ? `'${vote_choice}'` : 'NULL'},
  //           ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
  //           ${is_anonymous ? 1 : 0},
  //           ${ip_address ? `'${ip_address}'` : 'NULL'},
  //           ${user_agent ? `'${user_agent.replace(/'/g, "''")}'` : 'NULL'},
  //           ${proxy_id ?? 'NULL'},
  //           '${vote_method}',
  //           ${phone_number ? `'${phone_number}'` : 'NULL'},
  //           ${created_by ? `'${created_by}'` : 'NULL'},
  //           GETDATE(),
  //           ${valid_vote}
  //         )
  //       `;
  //     } else if (vote_type === 'resolution') {
  //       checkSql = `SELECT id FROM votes WHERE voter_id = ${voter_id} AND resolution_id = ${target_id}`;

  //       insertSql = `
  //         INSERT INTO votes (
  //           voter_id, vote_type, resolution_id, vote_choice, comment, is_anonymous,
  //           ip_address, user_agent, proxy_id, vote_method, phone_number,
  //           created_by, created_at, valid_vote
  //         )
  //         VALUES (
  //           ${voter_id},
  //           '${vote_type}',
  //           ${target_id},
  //           ${vote_choice ? `'${vote_choice}'` : 'NULL'},
  //           ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
  //           ${is_anonymous ? 1 : 0},
  //           ${ip_address ? `'${ip_address}'` : 'NULL'},
  //           ${user_agent ? `'${user_agent.replace(/'/g, "''")}'` : 'NULL'},
  //           ${proxy_id ?? 'NULL'},
  //           '${vote_method}',
  //           ${phone_number ? `'${phone_number}'` : 'NULL'},
  //           ${created_by ? `'${created_by}'` : 'NULL'},
  //           GETDATE(),
  //           ${valid_vote}
  //         )
  //       `;
  //     } else {
  //       throw new Error('Invalid vote type');
  //     }

  //     // 🚫 Check for existing vote
  //     const existingVotes = await database.query(checkSql);
  //     if (existingVotes.length > 0) {
  //       throw new Error(`You have already voted for this ${vote_type}`);
  //     }

  //     // ✅ Validate target
  //     if (vote_type === 'employee') {
  //       const employees = await database.query(
  //         `SELECT id FROM employees WHERE id = ${target_id} AND is_eligible_for_voting = 1`
  //       );
  //       if (employees.length === 0) {
  //         throw new Error('Invalid or ineligible employee');
  //       }
  //     } else if (vote_type === 'resolution') {
  //       const resolutions = await database.query(
  //         `SELECT id FROM resolutions WHERE id = ${target_id} AND status = 'open_for_voting'`
  //       );
  //       if (resolutions.length === 0) {
  //         throw new Error('Invalid resolution or voting is closed');
  //       }
  //     }

  //     // 🗳️ Insert vote
  //     await database.query(insertSql);

  //     // 🔄 Update vote count
  //     if (vote_type === 'employee') {
  //       await database.query(
  //         `UPDATE employees SET total_votes = total_votes + 1, updated_at = GETDATE() WHERE id = ${target_id}`
  //       );
  //     }

  //     return true;
  //   } catch (error) {
  //     console.error('Error in castVote:', error);
  //     throw error;
  //   }

  // }

    // static async castVote(voteData) {
    // const {
    //   voter_id,
    //   vote_type,
    //   target_id,
    //   vote_choice,
    //   comment,
    //   is_anonymous = true,
    //   ip_address,
    //   user_agent,
    //   proxy_id,
    //   vote_method = 'web',
    //   phone_number,
    //   created_by,
    //   is_proxy_vote = true,
    //   // group_id = 8
    // } = voteData;

    // try {
    //   console.log(`🔐 Starting vote process for voter ID: ${voter_id}`);

    //     // Get proxy group ID
    //   let groupId = null;
    //   if (is_proxy_vote) {
    //     const proxyGroupResult = await database.query(
    //       `SELECT id FROM proxy_groups WHERE principal_id = ${voter_id}`
    //     );
    //     groupId = proxyGroupResult.length > 0 ? proxyGroupResult[0].id : null;
    //     if (!groupId) {
    //       console.log(`⚠️ No active proxy group found for principal ID: ${voter_id}`);
    //     } else {
    //       console.log(`🔗 Proxy group found with ID: ${groupId}`);
    //     }
    //   }

    //   const userResult = await database.query(
    //     `SELECT role_id, name FROM users WHERE id = ${voter_id}`
    //   );
    //   if (userResult.length === 0) throw new Error('Voter not found');
    //   const role_id = userResult[0].role_id;
    //   const voterName = userResult[0].name;
    //   const valid_vote = (role_id === 1 || role_id === 2) ? 1 : 0;

    //   console.log(`👤 Voter: ${voterName} (Role ID: ${role_id}) — Valid vote: ${valid_vote}`);

    //   // Check for existing vote
    //   const checkSql =
    //     vote_type === 'employee'
    //       ? `SELECT id FROM votes WHERE voter_id = ${voter_id} AND employee_id = ${target_id}`
    //       : `SELECT id FROM votes WHERE voter_id = ${voter_id} AND resolution_id = ${target_id}`;
    //   const existingVotes = await database.query(checkSql);
    //   if (existingVotes.length > 0) throw new Error(`❌ Already voted for this ${vote_type}`);

    //   // Validate target
    //   if (vote_type === 'employee') {
    //     const employees = await database.query(
    //       `SELECT id FROM employees WHERE id = ${target_id} AND is_eligible_for_voting = 1`
    //     );
    //     if (employees.length === 0) throw new Error('Invalid or ineligible employee');
    //     console.log(`✅ Voting for employee: ${employees[0].id}`);
    //   } else if (vote_type === 'resolution') {
    //     const resolutions = await database.query(
    //       `SELECT id, title FROM resolutions WHERE id = ${target_id} AND status = 'open_for_voting'`
    //     );
    //     if (resolutions.length === 0) throw new Error('Invalid resolution or voting is closed');
    //     console.log(`✅ Voting for resolution: ${resolutions[0].title}`);
    //   }

    

    //   // Insert principal vote
    //   console.log(`🗳️ Inserting vote for principal: ${voterName}`);
    //   const insertPrincipalSql = `
    //     INSERT INTO votes (
    //       voter_id, vote_type, ${vote_type === 'employee' ? 'employee_id' : 'resolution_id'},
    //       vote_choice, comment, is_anonymous, ip_address, user_agent, proxy_id,
    //       vote_method, phone_number, created_by, created_at, valid_vote,
    //       is_proxy_vote, group_id
    //     )
    //     OUTPUT INSERTED.id
    //     VALUES (
    //       ${voter_id}, '${vote_type}', ${target_id},
    //       ${vote_choice ? `'${vote_choice}'` : 'NULL'},
    //       ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
    //       ${is_anonymous ? 1 : 0},
    //       ${ip_address ? `'${ip_address}'` : 'NULL'},
    //       ${user_agent ? `'${user_agent.replace(/'/g, "''")}'` : 'NULL'},
    //       ${proxy_id ?? 'NULL'}, '${vote_method}',
    //       ${phone_number ? `'${phone_number}'` : 'NULL'},
    //       ${created_by ? `'${created_by}'` : 'NULL'},
    //       GETDATE(), ${valid_vote},
    //       ${is_proxy_vote ? 1 : 0}, ${groupId ?? 'NULL'}
    //     )
    //   `;
    //   const voteResult = await database.query(insertPrincipalSql);
    //   const principalVoteId = voteResult[0].id;
    //   console.log(`✅ Principal vote inserted with ID: ${principalVoteId}`);
      

    //   // If proxy vote, insert votes for each member
    //   if (is_proxy_vote && groupId) {
    //     console.log(`🔗 Proxy vote detected. Fetching members of group ID: ${groupId}`);
    //     const members = await database.query(
    //       `SELECT member_id FROM proxy_group_members WHERE group_id = ${groupId}`
    //     );

    //     console.log(`👥 Proxy group members found: ${members.length}`);
    //     for (const member of members) {
    //       const memberInfo = await database.query(
    //         `SELECT name FROM users WHERE id = ${member.member_id}`
    //       );
    //       const memberName = memberInfo[0]?.name || 'Unknown';

    //       // Check if member already voted
    //       const memberCheckSql =
    //         vote_type === 'employee'
    //           ? `SELECT id FROM votes WHERE voter_id = ${member.member_id} AND employee_id = ${target_id}`
    //           : `SELECT id FROM votes WHERE voter_id = ${member.member_id} AND resolution_id = ${target_id}`;
    //       const memberVotes = await database.query(memberCheckSql);
    //       if (memberVotes.length > 0) {
    //         console.log(`⚠️ Skipping ${memberName} — already voted`);
    //         continue;
    //       }

    //       console.log(`🗳️ Logging proxy vote for ${memberName} (User ID: ${member.member_id})`);
    //       await database.query(`
    //         INSERT INTO votes (
    //           voter_id, vote_type, ${vote_type === 'employee' ? 'employee_id' : 'resolution_id'},
    //           vote_choice, comment, is_anonymous, ip_address, user_agent, proxy_id,
    //           vote_method, phone_number, created_by, created_at, valid_vote,
    //           is_proxy_vote, group_id
    //         )
    //         VALUES (
    //           ${member.member_id}, '${vote_type}', ${target_id},
    //           ${vote_choice ? `'${vote_choice}'` : 'NULL'},
    //           ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
    //           ${is_anonymous ? 1 : 0},
    //           ${ip_address ? `'${ip_address}'` : 'NULL'},
    //           ${user_agent ? `'${user_agent.replace(/'/g, "''")}'` : 'NULL'},
    //           ${voter_id}, '${vote_method}',
    //           ${phone_number ? `'${phone_number}'` : 'NULL'},
    //           ${created_by ? `'${created_by}'` : 'NULL'},
    //           GETDATE(), ${valid_vote},
    //           1, ${groupId}
    //         )
    //       `);
    //     }
    //   }

    //   // Update vote count
    //   if (vote_type === 'employee') {
    //     await database.query(
    //       `UPDATE employees SET total_votes = total_votes + 1, updated_at = GETDATE() WHERE id = ${target_id}`
    //     );
    //     console.log(`📊 Updated vote count for employee ID: ${target_id}`);
    //   }

    //   console.log(`✅ Voting process completed for principal voter: ${voterName}`);
    //   return principalVoteId;
    // } catch (error) {
    //   console.error('❌ Error in castVote:', error);
    //   throw error;
    // }
    // }

    
    

    static async castVote(voteData) {
  const {
    voter_id,
    vote_type,
    target_id,
    vote_choice,
    comment,
    is_anonymous = true,
    ip_address,
    user_agent,
    proxy_id,
    vote_method = 'web',
    phone_number,
    created_by,
    is_proxy_vote = true,
  } = voteData;

  try {
    console.log(`🔐 Starting vote process for voter ID: ${voter_id}`);

    // Get proxy group ID
    let groupId = null;
    if (is_proxy_vote) {
      const proxyGroupResult = await database.query(
        `SELECT id FROM proxy_groups WHERE principal_id = ${voter_id}`
      );
      groupId = proxyGroupResult.length > 0 ? proxyGroupResult[0].id : null;
      if (!groupId) {
        console.log(`⚠️ No active proxy group found for principal ID: ${voter_id}`);
      } else {
        console.log(`🔗 Proxy group found with ID: ${groupId}`);
      }
    }

    const userResult = await database.query(
      `SELECT role_id, name FROM users WHERE id = ${voter_id}`
    );
    if (userResult.length === 0) throw new Error('Voter not found');
    const role_id = userResult[0].role_id;
    const voterName = userResult[0].name;
    const valid_vote = (role_id === 1 || role_id === 2) ? 1 : 0;

    console.log(`👤 Voter: ${voterName} (Role ID: ${role_id}) — Valid vote: ${valid_vote}`);

    // Check for existing vote
    const checkSql =
      vote_type === 'employee'
        ? `SELECT id FROM votes WHERE voter_id = ${voter_id} AND employee_id = ${target_id}`
        : `SELECT id FROM votes WHERE voter_id = ${voter_id} AND resolution_id = ${target_id}`;
    const existingVotes = await database.query(checkSql);
    if (existingVotes.length > 0) throw new Error(`❌ Already voted for this ${vote_type}`);

    // Validate target
    if (vote_type === 'employee') {
      const employees = await database.query(
        `SELECT id FROM employees WHERE id = ${target_id} AND is_eligible_for_voting = 1`
      );
      if (employees.length === 0) throw new Error('Invalid or ineligible employee');
      console.log(`✅ Voting for employee: ${employees[0].id}`);
    } else if (vote_type === 'resolution') {
      const resolutions = await database.query(
        `SELECT id, title FROM resolutions WHERE id = ${target_id} AND status = 'open_for_voting'`
      );
      if (resolutions.length === 0) throw new Error('Invalid resolution or voting is closed');
      console.log(`✅ Voting for resolution: ${resolutions[0].title}`);
    }

    // Insert principal vote
    console.log(`🗳️ Inserting vote for principal: ${voterName}`);
    const insertPrincipalSql = `
      INSERT INTO votes (
        voter_id, vote_type, ${vote_type === 'employee' ? 'employee_id' : 'resolution_id'},
        vote_choice, comment, is_anonymous, ip_address, user_agent, proxy_id,
        vote_method, phone_number, created_by, created_at, valid_vote,
        is_proxy_vote, group_id
      )
      OUTPUT INSERTED.id
      VALUES (
        ${voter_id}, '${vote_type}', ${target_id},
        ${vote_choice ? `'${vote_choice}'` : 'NULL'},
        ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
        ${is_anonymous ? 1 : 0},
        ${ip_address ? `'${ip_address}'` : 'NULL'},
        ${user_agent ? `'${user_agent.replace(/'/g, "''")}'` : 'NULL'},
        ${proxy_id ?? 'NULL'}, '${vote_method}',
        ${phone_number ? `'${phone_number}'` : 'NULL'},
        ${created_by ? `'${created_by}'` : 'NULL'},
        GETDATE(), ${valid_vote},
        ${is_proxy_vote ? 1 : 0}, ${groupId ?? 'NULL'}
      )
    `;
    const voteResult = await database.query(insertPrincipalSql);
    const principalVoteId = voteResult[0].id;
    console.log(`✅ Principal vote inserted with ID: ${principalVoteId}`);

    // If proxy vote, insert votes for each member
    if (is_proxy_vote && groupId) {
      console.log(`🔗 Proxy vote detected. Fetching members of group ID: ${groupId}`);
      const members = await database.query(
        `SELECT pgm.id, pgm.member_id, pgm.appointment_type 
         FROM proxy_group_members pgm 
         WHERE pgm.group_id = ${groupId}`
      );

      console.log(`👥 Proxy group members found: ${members.length}`);
      
      for (const member of members) {
        const memberInfo = await database.query(
          `SELECT name FROM users WHERE id = ${member.member_id}`
        );
        const memberName = memberInfo[0]?.name || 'Unknown';

        // Check if member already voted
        const memberCheckSql =
          vote_type === 'employee'
            ? `SELECT id FROM votes WHERE voter_id = ${member.member_id} AND employee_id = ${target_id}`
            : `SELECT id FROM votes WHERE voter_id = ${member.member_id} AND resolution_id = ${target_id}`;
        const memberVotes = await database.query(memberCheckSql);
        if (memberVotes.length > 0) {
          console.log(`⚠️ Skipping ${memberName} — already voted`);
          continue;
        }

        // NEW: Check allowed_candidates for INSTRUCTIONAL proxies when voting for employees
        if (vote_type === 'employee' && member.appointment_type === 'INSTRUCTIONAL') {
          const allowedCheck = await database.query(
            `SELECT id FROM proxy_member_allowed_candidates 
             WHERE proxy_member_id = ${member.id} AND employee_id = ${target_id}`
          );
          
          if (allowedCheck.length === 0) {
            console.log(`⚠️ Skipping ${memberName} — employee ${target_id} not in allowed candidates list (INSTRUCTIONAL proxy)`);
            continue;
          }
          console.log(`✅ ${memberName} is authorized to vote for this employee (INSTRUCTIONAL proxy)`);
        } else if (member.appointment_type === 'DISCRETIONAL') {
          console.log(`✅ ${memberName} can vote for any candidate (DISCRETIONAL proxy)`);
        }

        console.log(`🗳️ Logging proxy vote for ${memberName} (User ID: ${member.member_id})`);
        await database.query(`
          INSERT INTO votes (
            voter_id, vote_type, ${vote_type === 'employee' ? 'employee_id' : 'resolution_id'},
            vote_choice, comment, is_anonymous, ip_address, user_agent, proxy_id,
            vote_method, phone_number, created_by, created_at, valid_vote,
            is_proxy_vote, group_id
          )
          VALUES (
            ${member.member_id}, '${vote_type}', ${target_id},
            ${vote_choice ? `'${vote_choice}'` : 'NULL'},
            ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
            ${is_anonymous ? 1 : 0},
            ${ip_address ? `'${ip_address}'` : 'NULL'},
            ${user_agent ? `'${user_agent.replace(/'/g, "''")}'` : 'NULL'},
            ${voter_id}, '${vote_method}',
            ${phone_number ? `'${phone_number}'` : 'NULL'},
            ${created_by ? `'${created_by}'` : 'NULL'},
            GETDATE(), ${valid_vote},
            1, ${groupId}
          )
        `);
        console.log(`✅ Vote recorded for ${memberName}`);
      }
    }

    // Update vote count - count how many votes were actually cast
    if (vote_type === 'employee') {
      // Count votes that were just inserted for this target
      const voteCountResult = await database.query(
        `SELECT COUNT(*) as count FROM votes 
         WHERE ${vote_type === 'employee' ? 'employee_id' : 'resolution_id'} = ${target_id} 
         AND group_id = ${groupId ?? 'NULL'} 
         AND created_at >= DATEADD(second, -5, GETDATE())`
      );
      const newVoteCount = voteCountResult[0]?.count || 1;
      
      await database.query(
        `UPDATE employees SET total_votes = total_votes + ${newVoteCount}, updated_at = GETDATE() WHERE id = ${target_id}`
      );
      console.log(`📊 Updated vote count for employee ID: ${target_id} (+${newVoteCount} votes)`);
    }

    console.log(`✅ Voting process completed for principal voter: ${voterName}`);
    return principalVoteId;
  } catch (error) {
    console.error('❌ Error in castVote:', error);
    throw error;
  }
    }

    // static async editVote(updateData) {
    //   const { voter_id, target_id, comment, vote_choice } = updateData;
    
    //   try {
    //     console.log(`✏️ Starting vote edit for voter ID: ${voter_id}, target ID: ${target_id}`);
    
    //     // Check if vote exists
    //     const existingVoteSql = `
    //       SELECT id, vote_type, employee_id, resolution_id, group_id, is_proxy_vote
    //       FROM votes 
    //       WHERE voter_id = ${voter_id} 
    //       AND (employee_id = ${target_id} OR resolution_id = ${target_id})
    //     `;
    //     const existingVotes = await database.query(existingVoteSql);
    
    //     if (existingVotes.length === 0) {
    //       throw new Error('No vote found to edit');
    //     }
    
    //     const vote = existingVotes[0];
    //     const vote_type = vote.vote_type;
    //     const groupId = vote.group_id;
    //     const isProxyVote = vote.is_proxy_vote;
    
    //     console.log(`📝 Editing ${vote_type} vote (ID: ${vote.id})`);
    
    //     // Update the principal's vote
    //     const updateSql = `
    //       UPDATE votes 
    //       SET 
    //         comment = ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
    //         ${vote_choice ? `vote_choice = '${vote_choice}',` : ''}
    //         updated_at = GETDATE()
    //       WHERE id = ${vote.id}
    //     `;
    //     await database.query(updateSql);
    //     console.log(`✅ Principal vote updated (Vote ID: ${vote.id})`);
    
    //     // If it's a proxy vote, update all related proxy votes
    //     if (isProxyVote && groupId) {
    //       console.log(`🔗 Updating proxy votes for group ID: ${groupId}`);
          
    //       const updateProxySql = `
    //         UPDATE votes 
    //         SET 
    //           comment = ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'},
    //           ${vote_choice ? `vote_choice = '${vote_choice}',` : ''}
    //           updated_at = GETDATE()
    //         WHERE group_id = ${groupId} 
    //         AND proxy_id = ${voter_id}
    //         AND ${vote_type === 'employee' ? 'employee_id' : 'resolution_id'} = ${target_id}
    //       `;
    //       const proxyUpdateResult = await database.query(updateProxySql);
    //       console.log(`✅ Updated ${proxyUpdateResult.rowsAffected || 0} proxy votes`);
    //     }
    
    //     console.log(`✅ Vote edit completed for voter ID: ${voter_id}`);
    //     return vote.id;
    //   } catch (error) {
    //     console.error('❌ Error in editVote:', error);
    //     throw error;
    //   }
    // }

    // Add to Vote model
    
    static async editVote(updateData) {
      const { voter_id, target_id, vote_type, comment, vote_choice } = updateData;

      try {
        console.log(`✏️ Starting vote edit for voter ID: ${voter_id}, target ID: ${target_id}, type: ${vote_type}`);

        // Check if vote exists
        const columnName = vote_type === 'employee' ? 'employee_id' : 'resolution_id';
        const existingVoteSql = `
          SELECT id, vote_type, employee_id, resolution_id, group_id, is_proxy_vote
          FROM votes 
          WHERE voter_id = ${voter_id} 
          AND ${columnName} = ${target_id}
        `;
        const existingVotes = await database.query(existingVoteSql);

        if (existingVotes.length === 0) {
          throw new Error('No vote found to edit');
        }

        const vote = existingVotes[0];
        const groupId = vote.group_id;
        const isProxyVote = vote.is_proxy_vote;

        console.log(`📝 Editing ${vote_type} vote (ID: ${vote.id})`);

        // Build update fields
        const updateFields = [];
        if (comment !== undefined) {
          updateFields.push(`comment = ${comment ? `'${comment.replace(/'/g, "''")}'` : 'NULL'}`);
        }
        if (vote_choice !== undefined && vote_type === 'resolution') {
          updateFields.push(`vote_choice = ${vote_choice ? `'${vote_choice}'` : 'NULL'}`);
        }
        updateFields.push('updated_at = GETDATE()');

        // Update the principal's vote
        const updateSql = `
          UPDATE votes 
          SET ${updateFields.join(', ')}
          WHERE id = ${vote.id}
        `;
        await database.query(updateSql);
        console.log(`✅ Principal vote updated (Vote ID: ${vote.id})`);

        // If it's a proxy vote, update all related proxy votes
        if (isProxyVote && groupId) {
          console.log(`🔗 Updating proxy votes for group ID: ${groupId}`);
          
          const updateProxySql = `
            UPDATE votes 
            SET ${updateFields.join(', ')}
            WHERE group_id = ${groupId} 
            AND proxy_id = ${voter_id}
            AND ${columnName} = ${target_id}
            AND voter_id != ${voter_id}
          `;
          const proxyUpdateResult = await database.query(updateProxySql);
          console.log(`✅ Updated proxy votes`);
        }

        console.log(`✅ Vote edit completed for voter ID: ${voter_id}`);
        return vote.id;
      } catch (error) {
        console.error('❌ Error in editVote:', error);
        throw error;
      }
    }

    static async removeVote(removeData) {
  const { voter_id, target_id } = removeData;

  try {
    console.log(`🗑️ Starting employee vote removal`);
    console.log(`🔍 Input Data:`, { voter_id, target_id });

    const columnName = 'employee_id';
    console.log(`📌 Using column: ${columnName}`);

    const existingVoteSql = `
      SELECT id, employee_id, group_id, is_proxy_vote
      FROM votes 
      WHERE voter_id = ${voter_id} 
      AND ${columnName} = ${target_id}
    `;
    console.log(`📄 Executing SQL to find existing vote:\n${existingVoteSql}`);

    const existingVotes = await database.query(existingVoteSql);
    console.log(`🔍 Found votes:`, existingVotes);

    if (existingVotes.length === 0) {
      console.warn(`⚠️ No employee vote found for voter_id ${voter_id} and employee_id ${target_id}`);
      throw new Error('No vote found to remove');
    }

    const vote = existingVotes[0];
    const groupId = vote.group_id;
    const isProxyVote = vote.is_proxy_vote;

    console.log(`🗑️ Preparing to remove vote ID: ${vote.id}, Proxy: ${isProxyVote}, Group ID: ${groupId}`);

    let totalRemoved = 0;

    const deleteSql = `DELETE FROM votes WHERE id = ${vote.id}`;
    console.log(`🧹 Deleting principal vote:\n${deleteSql}`);
    await database.query(deleteSql);
    totalRemoved++;
    console.log(`✅ Principal vote removed (Vote ID: ${vote.id})`);

    if (isProxyVote && groupId) {
      console.log(`🔗 Proxy vote detected. Removing related proxy votes for group ID: ${groupId}`);

      const deleteProxySql = `
        DELETE FROM votes 
        WHERE group_id = ${groupId} 
        AND proxy_id = ${voter_id}
        AND ${columnName} = ${target_id}
        AND voter_id != ${voter_id}
      `;
      console.log(`🧹 Deleting proxy votes:\n${deleteProxySql}`);
      const proxyDeleteResult = await database.query(deleteProxySql);
      const proxyCount = proxyDeleteResult.rowsAffected || 0;
      totalRemoved += proxyCount;
      console.log(`✅ Removed ${proxyCount} proxy votes`);
    }

    const updateSql = `
      UPDATE employees 
      SET total_votes = total_votes - ${totalRemoved}, 
          updated_at = GETDATE() 
      WHERE id = ${target_id}
    `;
    console.log(`📊 Updating employee vote count:\n${updateSql}`);
    await database.query(updateSql);
    console.log(`📉 Vote count updated for employee ID: ${target_id}`);

    console.log(`✅ Employee vote removal completed. Total votes removed: ${totalRemoved}`);
    return totalRemoved;
  } catch (error) {
    console.error('❌ Error in removeVote:', error);
    throw error;
  }
}

  static async getVoteLogs() {
    try {
      const sql = `
        SELECT 
          v.id,
          v.voter_id,
          u.email AS voter_email,
          v.vote_type,
          v.employee_id,
          v.resolution_id,
          v.vote_weight,
          v.comment,
          v.is_anonymous,
          v.ip_address,
          v.created_at,
          v.valid_vote
        FROM votes v
        LEFT JOIN users u ON v.voter_id = u.id
        WHERE v.valid_vote = 1
        ORDER BY v.created_at DESC
      `;

      const result = await database.query(sql);
      return result.recordset || result;
    } catch (error) {
      console.error('Error fetching vote logs:', error);
      return [];
    }
  }






    
    static async hasUserVoted(userId, voteType, targetId) {
        try {
            let sql;
            
            if (voteType === 'employee') {
                sql = `SELECT id FROM votes WHERE voter_id = ${userId} AND employee_id = ${targetId}`;
            } 
            // else if (voteType === 'resolution') {
            //     sql = `SELECT id FROM votes WHERE voter_id = ${userId} AND resolution_id = ${targetId}`;
            // } else {
            //     throw new Error('Invalid vote type');
            // }

            const result = await database.query(sql);
            return result.length > 0;
        } catch (error) {
            console.error('Error checking if user voted:', error);
            return false;
        }
    }

    static async getVotesByUser(userId) {
        try {
            const sql = `
                SELECT v.*, e.name as employee_name, r.title as resolution_title
                FROM votes v
                LEFT JOIN employees e ON v.employee_id = e.id
                LEFT JOIN resolutions r ON v.resolution_id = r.id
                WHERE v.voter_id = ${userId}
                ORDER BY v.created_at DESC
            `;
            return await database.query(sql);
        } catch (error) {
            console.error('Error fetching user votes:', error);
            throw error;
        }
    }

//   static async getVoteStatusByUserId(userId) {
//     try {
//       const sql = `
//         SELECT v.id, v.vote_type, v.employee_id, v.resolution_id, 
//                v.comment, v.is_anonymous, v.created_at,
//                e.name as employee_name, u.name as employee_user_name,
//                r.title as resolution_title
//         FROM votes v
//         LEFT JOIN employees emp ON v.employee_id = emp.id
//         LEFT JOIN users u ON emp.user_id = u.id
//         LEFT JOIN employees e ON v.employee_id = e.id
//         LEFT JOIN resolutions r ON v.resolution_id = r.id
//         WHERE v.voter_id = ${userId}
//         ORDER BY v.created_at DESC
//       `;
//       return await database.query(sql);
//     } catch (error) {
//       console.error('Error fetching vote status by user ID:', error);
//       throw error;
//     }
//   }

    static async getVoteStatusByUserId(userId) {
        try {
            // First, get the employee record for this user to find their employee_id
            const employeeSql = `SELECT id FROM employees WHERE user_id = ${userId} AND is_eligible_for_voting = 1`;
            const employeeResult = await database.query(employeeSql, [userId]);
            
            if (employeeResult.length === 0) {
                return {
                    success: true,
                    data: {
                        totalVotes: 0,
                        totalVoteCount: 0,
                        voters: []
                    }
                };
            }
            
            const employeeId = employeeResult[0].id;
            
            // Get all votes for this employee (votes they received)
            const votesSql = `
                SELECT 
                    v.id, 
                    v.vote_type, 
                    v.created_at, 
                    v.comment, 
                    v.vote_weight, 
                    v.is_anonymous, 
                    v.vote_method,
                    v.voter_id,
                    voter.name as voter_name,
                    voter.email as voter_email,
                    proxy_user.name as proxy_name,
                    proxy_user.email as proxy_email
                FROM votes v
                JOIN users voter ON v.voter_id = voter.id
                LEFT JOIN users proxy_user ON v.proxy_id = proxy_user.id
                WHERE v.vote_type = 'employee' AND v.employee_id = ${employeeId}
                ORDER BY v.created_at DESC
            `;
            
            const votesResult = await database.query(votesSql);
            
            // Calculate total vote weight
            const totalVotes = votesResult.reduce((sum, vote) => sum + (vote.vote_weight || 1), 0);
            
            // Format voters array
            const voters = votesResult.map(vote => ({
                id: vote.id,
                voter_id: vote.voter_id,
                voter_name: vote.is_anonymous ? 'Anonymous' : vote.voter_name,
                voter_email: vote.is_anonymous ? null : vote.voter_email,
                proxy_name: vote.proxy_name,
                proxy_email: vote.proxy_email,
                vote_weight: vote.vote_weight || 1,
                comment: vote.comment,
                created_at: vote.created_at,
                vote_method: vote.vote_method,
                is_anonymous: vote.is_anonymous
            }));
            
            return {
                success: true,
                data: {
                    totalVotes,
                    totalVoteCount: votesResult.length,
                    voters
                }
            };
            
        } catch (error) {
            console.error('Error in getVoteStatusByUserId:', error);
            return {
                success: false,
                message: error.message || 'Failed to get vote status',
                data: {
                    totalVotes: 0,
                    totalVoteCount: 0,
                    voters: []
                }
            };
        }
    }

}

export default Vote;
