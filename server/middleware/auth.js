import jwt from 'jsonwebtoken';
import database from '../config/database.js';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const user = await database.query(
      'SELECT id, email, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user.length || !user[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not active'
      });
    }

    req.user = {
      userId: decoded.userId,
      email: user[0].email
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export default auth;