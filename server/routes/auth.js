import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import emailService from '../services/emailService.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  // windowMs: 15 * 60 * 1000,
  // max: 5,
  // message: { error: 'Too many authentication attempts, please try again later.' }
});

// Login route
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    console.log('🔐 Login attempt started for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log('🔍 Looking up user:', email);
    const user = await User.findByEmail(email);

    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role_name: user.role_name,
      is_active: user.is_active,
      password_hash_length: user.password_hash ? user.password_hash.length : 0
    });

    console.log('🔒 Verifying password...');
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    console.log('🔒 Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    await User.updateLastLogin(user.id);

    // ✅ Log the login event
    await User.logLogin({
      userId: user.id,
      email: user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role_name,
        name: user.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      membership_number: user.member_number,
      member_number: user.member_number,
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



// // Register new employee (for existing users to become employees)
// router.post('/register-employee', auth, async (req, res) => {
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

// Register new user account

// Register route
router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail(),
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

    const { email, name, avatar_url, role } = req.body;
    
    // Generate a secure random password
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    console.log('Generated password for user:', password);

    if (await User.emailExists(email)) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    console.log('Creating user with data:', { email, name, avatar_url });
    const userId = await User.create({
      email,
      password,
      name,
      avatar_url: avatar_url || null,
      role_id: 1
    });
    
    console.log('User created with ID:', userId);

    // Send welcome email with credentials
    try {
      console.log('Sending welcome email to:', email);
      const emailResult = await emailService.sendWelcomeEmail(email, name, password);
      
      if (emailResult.success) {
        console.log('Welcome email sent successfully');
      } else {
        console.error('Failed to send welcome email:', emailResult.error);
        // Don't fail registration if email fails, just log it
      }
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Continue with registration even if email fails
    }

    // // Get the created user for token generation
    // const user = await User.findById(userId);
    
    // if (!user) {
    //   return res.status(500).json({
    //     success: false,
    //     message: 'New User Creation Failed'
    //   });
    // }
    
    // Generate JWT token for immediate login
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role_name,
        name: user.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar_url,
      member_number: user.member_number,
      role: user.role_name?.toLowerCase() || 'voter'
    };

    res.status(201).json({
      success: true,
      message: `User registered successfully! Welcome email with password sent to ${email}`,
      token,
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Registration error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

router.post('/registerM', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 2 }).trim()
], async (req, res) => {
    // Send welcome email with credentials
    try {
      // console.log('Sending welcome email to:', email);
      console.log('Email service available:', typeof emailService.sendWelcomeEmail);
      console.log('Password being sent:', password ? 'Password exists' : 'No password');
      
      const emailResult = await emailService.sendWelcomeEmail(email, name, password);
      
      console.log('Email result:', emailResult);
      
      if (emailResult.success) {
        console.log('Welcome email sent successfully');
      } else {
        console.error('Failed to send welcome email:', emailResult.error);
        // Don't fail registration if email fails, just log it
      }
    } catch (emailError) {
      console.error('Email service error:', emailError);
      console.error('Email error stack:', emailError.stack);
      // Continue with registration even if email fails
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId || decoded.id);

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
      member_number: user.member_number,
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

    // Verify the Microsoft access token
    try {
      console.log('Verifying Microsoft access token...');
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Microsoft API error: ${response.status}`);
      }
      
      const microsoftUser = await response.json();
      console.log('Microsoft Graph API response:', microsoftUser);
      
      // Check if user exists in our database
      let existingUser = await User.findByEmail(microsoftUser.mail || microsoftUser.userPrincipalName);
      
      console.log('Existing user found:', !!existingUser);
      
      if (!existingUser) {
        console.log('Creating new user from Microsoft account');
        // Create new user
        const hashedPassword = await bcrypt.hash('microsoft-oauth-' + Date.now(), 10);
        
        const userId = await User.create({
          name: microsoftUser.displayName,
          email: microsoftUser.mail || microsoftUser.userPrincipalName,
          password: hashedPassword,
          role_id: 1, // Default voter role
          avatar_url: null
        });
        
        existingUser = await User.findById(userId);
        console.log('New user created with ID:', userId);
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: existingUser.id,
          userId: existingUser.id,
          email: existingUser.email, 
          role: existingUser.role_name,
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
          role: existingUser.role_name?.toLowerCase() || 'voter',
          member_number: existingUser.member_number,
          avatar: existingUser.avatar_url,
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

// Test credentials endpoint (for development)


router.get('/test-credentials', async (req, res) => {
  try {
    // Get a test user from database
    const testUser = await User.findByEmail('test@example.com');
    
    if (testUser) {
      res.json({
        success: true,
        testCredentials: {
          email: testUser.email,
          password: 'password123', // Known test password
          name: testUser.name,
          role: testUser.role_name
        }
      });
    } else {
      res.json({
        success: false,
        message: 'No test user found. Please create a test user first.'
      });
    }
  } catch (error) {
    console.error('Error getting test credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get test credentials'
    });
  }
});

// Update password route
router.post('/update-password', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ success: false, message: 'User ID and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    await User.updatePassword(userId, password);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate random temporary password
    const tempPassword = Array.from({ length: 10 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
        .charAt(Math.floor(Math.random() * 62))
    ).join('');

    // Update user with temp password
    await User.setTempPassword(user.id, tempPassword);

    // Send email (implement your email service here)
    // await sendPasswordResetEmail(email, user.name, tempPassword);
    
    console.log(`Temp password for ${email}: ${tempPassword}`); // Remove in production

    res.json({ 
      success: true, 
      message: 'Temporary password sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});



export default router;