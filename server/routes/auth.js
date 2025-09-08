import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

// Login route
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    const token1 = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token1, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    if (!user || !(await User.verifyPassword(password, user.password_hash))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    await User.updateLastLogin(user.id);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role_name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar_url,
      role: user.role_name?.toLowerCase() || 'voter'
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Register route
router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 2 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    const { email, password, name, avatar_url } = req.body;

    if (await User.emailExists(email)) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const userId = await User.create({
      email,
      password,
      name,
      avatar_url: avatar_url || null,
      role_id: 2
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token route
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar_url,
      role: user.role_name?.toLowerCase() || 'voter'
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

export default router;
