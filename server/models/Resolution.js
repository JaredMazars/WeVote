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

    static async findatabaseyId(id) {
        const sql = `
            SELECT * FROM resolutions WHERE id = ${id}
        `;
        
        const results = await database.query(sql, [id]);
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await database.query(sql, [
            title, description, details, resolution_date, resolution_time, location,
            image_url, organizer_id, category_id, budget, max_participants,
            registration_required, registration_deadline, status, is_featured
        ]);
        
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
            SET title = ?, description = ?, details = ?, resolution_date = ?, resolution_time = ?,
                location = ?, image_url = ?, category_id = ?, budget = ?,
                max_participants = ?, registration_required = ?, registration_deadline = ?,
                status = ?, is_featured = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        await database.query(sql, [
            title, description, details, resolution_date, resolution_time, location,
            image_url, category_id, budget, max_participants,
            registration_required, registration_deadline, status, is_featured, id
        ]);
        
        return true;
    }

    static async softDelete(id) {
        const sql = `UPDATE resolutions SET status = 'cancelled' WHERE id = ?`;
        await database.query(sql, [id]);
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
            LIMIT ?
        `;
        
        return await database.query(sql, [limit]);
    }
}

export default Resolution 