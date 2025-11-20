import database from '../config/database.js';
class Resolution {
    static async getAllForVoting() {
        const sql = `
            SELECT e.id, e.title, e.description, e.resolution_date, e.location,
                   e.image_url, e.total_votes, e.is_featured, e.budget,
                   u.name as organizer, ec.name as category, ec.color_code
            FROM resolutions e
            JOIN users u ON e.organizer_id = u.id
            JOIN resolution_categories ec ON e.category_id = ec.id
            WHERE e.status = 'open_for_voting'
            ORDER BY e.is_featured DESC, e.total_votes DESC
        `;
        
        return await database.query(sql);
    }

    static async findById(id) {
        const sql = `
            SELECT * FROM resolutions WHERE id = ${id}
        `;
        
        const results = await database.query(sql);
        return results[0] || null;
    }

    static async create(resolutionData) {
        const {
            title, description, details, resolution_date, resolution_time, location,
            image_url, organizer_id, category_id, budget, max_participants,
            registration_required, registration_deadline, status = 'draft',
            is_featured = 0
        } = resolutionData;
        
        const sql = `
            INSERT INTO resolutions (title, description, details, resolution_date, resolution_time,
                              location, image_url, organizer_id, category_id, budget,
                              max_participants, registration_required, registration_deadline,
                              status, is_featured)
            VALUES ('${title}', '${description}', '${details}', '${resolution_date}', '${resolution_time}',
                    '${location}', '${image_url}', ${organizer_id}, ${category_id}, ${budget},
                    ${max_participants}, ${registration_required}, '${registration_deadline}',
                    '${status}', ${is_featured})
        `;
        
        const result = await database.query(sql);
        
        return result.insertId;
    }

    static async update(id, resolutionData) {
        const {
            title, description, details, resolution_date, resolution_time, location,
            image_url, category_id, budget, max_participants,
            registration_required, registration_deadline, status, is_featured
        } = resolutionData;
        
        const sql = `
            UPDATE resolutions
            SET title = '${title}', description = '${description}', details = '${details}', 
                resolution_date = '${resolution_date}', resolution_time = '${resolution_time}',
                location = '${location}', image_url = '${image_url}', category_id = ${category_id}, 
                budget = ${budget}, max_participants = ${max_participants}, 
                registration_required = ${registration_required}, 
                registration_deadline = '${registration_deadline}',
                status = '${status}', is_featured = ${is_featured}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
        `;
        
        await database.query(sql);
        
        return true;
    }

    static async softDelete(id) {
        const sql = `UPDATE resolutions SET status = 'cancelled' WHERE id = ${id}`;
        await database.query(sql);
        return true;
    }

    static async getCategories() {
        const sql = `
            SELECT id, name, description, color_code
            FROM resolution_categories
            WHERE is_active = 1
            ORDER BY name ASC
        `;
        
        return await database.query(sql);
    }

    static async getVotingStats() {
        const sql = `
            SELECT 
                COUNT(*) as total_resolution,
                SUM(total_votes) as total_votes,
                AVG(total_votes) as avg_votes,
                MAX(total_votes) as max_votes
            FROM resolutions
            WHERE status = 'open_for_voting'
        `;
        
        const results = await database.query(sql);
        return results[0];
    }

    static async getFeatured(limit = 3) {
        const sql = `
            SELECT e.id, e.title, e.description, e.resolution_date, e.location,
                   e.image_url, e.total_votes, ec.name as category
            FROM resolutions e
            JOIN resolution_categories ec ON e.category_id = ec.id
            WHERE e.status = 'open_for_voting' AND e.is_featured = 1
            ORDER BY e.total_votes DESC
            LIMIT ${limit}
        `;
        
        return await database.query(sql);
    }

    static async getVoteStatusByResolutionId(resolutionId) {
        try {
            // Get all votes for this resolution (votes it received)
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
                WHERE v.vote_type = 'resolution' AND v.resolution_id = ${resolutionId}
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
            console.error('Error in getVoteStatusByResolutionId:', error);
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

export default Resolution;