import database from "../config/database.js";
class Vote {
    static async castVote(voteData) {
        const { voter_id, vote_type, target_id, comment, is_anonymous = 1, ip_address, user_agent } = voteData;
        
        return await database.transaction(async (connection) => {
            // Check if user has already voted for this target
            let checkSql, insertSql;
            let checkParams, insertParams;
            
            if (vote_type === 'employee') {
                checkSql = `SELECT id FROM votes WHERE voter_id = ? AND employee_id = ?`;
                checkParams = [voter_id, target_id];
                
                insertSql = `
                    INSERT INTO votes (voter_id, vote_type, employee_id, comment, is_anonymous, ip_address, user_agent)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                insertParams = [voter_id, vote_type, target_id, comment, is_anonymous, ip_address, user_agent];
            } else if (vote_type === 'event') {
                checkSql = `SELECT id FROM votes WHERE voter_id = ? AND event_id = ?`;
                checkParams = [voter_id, target_id];
                
                insertSql = `
                    INSERT INTO votes (voter_id, vote_type, event_id, comment, is_anonymous, ip_address, user_agent)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                insertParams = [voter_id, vote_type, target_id, comment, is_anonymous, ip_address, user_agent];
            } else {
                throw new Error('Invalid vote type');
            }
            
            // Check for existing vote
            const [existingVotes] = await connection.execute(checkSql, checkParams);
            if (existingVotes.length > 0) {
                throw new Error(`You have already voted for this ${vote_type}`);
            }
            
            // Validate target exists
            if (vote_type === 'employee') {
                const [employees] = await connection.execute(
                    `SELECT id FROM employees WHERE id = ? AND is_eligible_for_voting = 1`,
                    [target_id]
                );
                if (employees.length === 0) {
                    throw new Error('Invalid or ineligible employee');
                }
            } else if (vote_type === 'event') {
                const [events] = await connection.execute(
                    `SELECT id FROM events WHERE id = ? AND status = 'open_for_voting'`,
                    [target_id]
                );
                if (events.length === 0) {
                    throw new Error('Invalid event or voting is closed');
                }
            }
            
            // Insert vote
            const [result] = await connection.execute(insertSql, insertParams);
            return result.insertId;
        });
    }

    static async getUserVotes(userId) {
        const sql = `
            SELECT v.id, v.vote_type, v.created_at, v.comment,
                   CASE 
                       WHEN v.vote_type = 'employee' THEN u.name
                       WHEN v.vote_type = 'event' THEN e.title
                   END as target_name,
                   CASE 
                       WHEN v.vote_type = 'employee' THEN v.employee_id
                       WHEN v.vote_type = 'event' THEN v.event_id
                   END as target_id
            FROM votes v
            LEFT JOIN employees emp ON v.employee_id = emp.id
            LEFT JOIN users u ON emp.user_id = u.id
            LEFT JOIN events e ON v.event_id = e.id
            WHERE v.voter_id = ?
            ORDER BY v.created_at DESC
        `;
        
        return await database.query(sql, [userId]);
    }

    static async getVoteStats() {
        const sql = `
            SELECT 
                vote_type,
                COUNT(*) as total_votes,
                COUNT(DISTINCT voter_id) as unique_voters
            FROM votes
            GROUP BY vote_type
        `;
        
        return await database.query(sql);
    }

    static async hasUserVoted(userId, voteType, targetId) {
        let sql, params;
        
        if (voteType === 'employee') {
            sql = `SELECT id FROM votes WHERE voter_id = ? AND employee_id = ?`;
            params = [userId, targetId];
        } else if (voteType === 'event') {
            sql = `SELECT id FROM votes WHERE voter_id = ? AND event_id = ?`;
            params = [userId, targetId];
        } else {
            return false;
        }
        
        const results = await database.query(sql, params);
        return results.length > 0;
    }

    static async getRecentVotes(limit = 10) {
        const sql = `
            SELECT v.id, v.vote_type, v.created_at, v.is_anonymous,
                   u.name as voter_name,
                   CASE 
                       WHEN v.vote_type = 'employee' THEN emp_user.name
                       WHEN v.vote_type = 'event' THEN e.title
                   END as target_name
            FROM votes v
            JOIN users u ON v.voter_id = u.id
            LEFT JOIN employees emp ON v.employee_id = emp.id
            LEFT JOIN users emp_user ON emp.user_id = emp_user.id
            LEFT JOIN events e ON v.event_id = e.id
            ORDER BY v.created_at DESC
            LIMIT ?
        `;
        
        return await database.query(sql, [limit]);
    }
}

export default Vote