import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import Employee from '../models/Employee.js';


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

// Microsoft OAuth login
router.post('/microsoft', async (req, res) => {
  try {
    const { accessToken, user } = req.body;

    console.log('Microsoft OAuth request received');
    console.log('Access token present:', !!accessToken);
    console.log('User data:', user);

    if (!accessToken || !user) {
      return res.status(400).json({
        success: false,
        message: 'Missing access token or user data'
      });
    }

    try {
      console.log('Verifying Microsoft access token...');
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Microsoft Graph API error: ${errorData}`);
      }

      const microsoftUser = await response.json();
      console.log('Microsoft Graph API user:', microsoftUser);

      let existingUser = await User.findByEmail(microsoftUser.mail || microsoftUser.userPrincipalName);
      console.log('Existing user found:', !!existingUser);

      if (existingUser) {
        console.log('User ID:', existingUser.id); // Now this will work!
      }


      // const password_hash = await bcrypt.hash('microsoft-oauth-' + Date.now(), 10);
      
      if (!existingUser) {
        console.log('Creating new user from Microsoft account');
        const userData = {
          name: microsoftUser.displayName,
          email: microsoftUser.mail || microsoftUser.userPrincipalName,
          password: 'Password123',
          role: 'voter',
          microsoft_id: microsoftUser.id
        };

        // const employeeData


        const userId = await User.create(userData);
        // const employeeId = await Employee.create()
        existingUser = await User.findById(userId);
        console.log('New user created with ID:', userId);
      }

      const token = jwt.sign(
        {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          name: existingUser.name
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      console.log('JWT token generated successfully');
      res.json({
        success: true,
        message: 'Microsoft login successful',
        token,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          avatar: existingUser.avatar_url
        }
      });

    } catch (verifyError) {
      console.error('Microsoft token verification failed:', verifyError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid Microsoft access token',
        details: verifyError.message
      });
    }

  } catch (error) {
    console.error('Microsoft OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Microsoft authentication failed'
    });
  }
});


// // Microsoft OAuth login
// router.post('/microsoft', async (req, res) => {
//   try {
//     const { accessToken, user } = req.body;
    
//     if (!accessToken || !user) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing access token or user data'
//       });
//     }

//     // Verify the Microsoft access token
//     try {
//       const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
//         headers: {
//           Authorization: `Bearer ${accessToken}`
//         }
//       });
      
//       const microsoftUser = response.data;
      
//       // Check if user exists in our database
//       let existingUser = await User.findByEmail(microsoftUser.mail || microsoftUser.userPrincipalName);
      
//       if (!existingUser) {
//         // Create new user
//         const userData = {
//           name: microsoftUser.displayName,
//           email: microsoftUser.mail || microsoftUser.userPrincipalName,
//           password: 'microsoft-oauth', // Placeholder password
//           role: 'voter',
//           microsoft_id: microsoftUser.id
//         };
        
//         const userId = await User.create(userData);
//         existingUser = await User.findById(userId);
//       }
      
//       // Generate JWT token
//       const token = jwt.sign(
//         { 
//           id: existingUser.id, 
//           email: existingUser.email, 
//           role: existingUser.role,
//           name: existingUser.name
//         },
//         process.env.JWT_SECRET || 'your-secret-key',
//         { expiresIn: '24h' }
//       );
      
//       res.json({
//         success: true,
//         message: 'Microsoft login successful',
//         token,
//         user: {
//           id: existingUser.id,
//           name: existingUser.name,
//           email: existingUser.email,
//           role: existingUser.role,
//           avatar: existingUser.avatar_url
//         }
//       });
      
//     } catch (verifyError) {
//       console.error('Microsoft token verification failed:', verifyError);
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid Microsoft access token'
//       });
//     }
    
//   } catch (error) {
//     console.error('Microsoft OAuth error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Microsoft authentication failed'
//     });
//   }
// });


export default router;





