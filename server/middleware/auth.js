import jwt from 'jsonwebtoken';
import database from '../config/database.js';

export const auth = async (req, res, next) => {
  try {
    console.log('🔐 [AUTH-MIDDLEWARE] Starting authentication...');
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔑 [AUTH-MIDDLEWARE] Token received:', token ? `Token exists (${token.length} chars)` : 'No token');
    
    if (!token) {
      console.log('❌ [AUTH-MIDDLEWARE] No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    console.log('🔓 [AUTH-MIDDLEWARE] Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ [AUTH-MIDDLEWARE] Token decoded successfully:', { id: decoded.id, email: decoded.email });

    console.log('📊 [AUTH-MIDDLEWARE] Querying user from database...');
    // Use parameterized query and 'id' from payload
    const [users] = await database.query(
      `SELECT id, email, is_active, role_id FROM users WHERE id = ${decoded.id}`,
    );

    console.log(`👤 [AUTH-MIDDLEWARE] Database query result: ${users?.length || 0} users found`);
    if (users?.length > 0) {
      console.log('👤 [AUTH-MIDDLEWARE] User details:', {
        id: users[0].id,
        email: users[0].email,
        role_id: users[0].role_id,
        is_active: users[0].is_active
      });
    }

    if (!users.length || !users[0].is_active) {
      console.log('❌ [AUTH-MIDDLEWARE] User not found or inactive');
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not active'
      });
    }

    req.user = {
      id: users[0].id,
      email: users[0].email,
      role_id: users[0].role_id
    };

    console.log('✅ [AUTH-MIDDLEWARE] Authentication successful, user attached to request:', req.user);
    next();
  } catch (error) {
    console.error('💥 [AUTH-MIDDLEWARE] Auth middleware error:', error);
    console.error('💥 [AUTH-MIDDLEWARE] Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export default auth;
