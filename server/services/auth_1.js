// import express from 'express';
// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import { body, validationResult } from 'express-validator';
// import rateLimit from 'express-rate-limit';
// import Employee from '../models/Employee.js';
// import EmailService from '../services/emailService.js';
// import bcrypt from 'bcryptjs';

// const router = express.Router();

// // Register
// router.post('/register', async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;
    
//     if (!name || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide all required fields'
//       });
//     }

//     // Check if user already exists
//     const existingUser = await User.findByEmail(email);
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: 'User already exists with this email'
//       });
//     }

//     // Hash password
//     const hashedPassword = password

//     // Create user
//     const userData = {
//       name,
//       email,
//       password: hashedPassword,
//       role: role || 'voter'
//     };

//     const userId = await User.create(userData);
//     const user = await User.findById(userId);

//     // Send welcome email with credentials
//     try {
//       console.log('Sending welcome email to:', email);
//       const emailResult = await EmailService.sendWelcomeEmail(email, name, password);
      
//       if (emailResult.success) {
//         console.log('Welcome email sent successfully');
//       } else {
//         console.error('Failed to send welcome email:', emailResult.error);
//         // Don't fail registration if email fails, just log it
//       }
//     } catch (emailError) {
//       console.error('Email service error:', emailError);
//       // Continue with registration even if email fails
//     }
//     // Generate JWT token
//     const token = jwt.sign(
//       { 
//         id: user.id, 
//         email: user.email, 
//         role: user.role,
//         name: user.name
//       },
//       process.env.JWT_SECRET || 'your-secret-key',
//       { expiresIn: '24h' }
//     );

//     res.status(201).json({
//       success: true,
//       message: 'User registered successfully. Welcome email sent to your inbox!',
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         avatar: user.avatar_url
//       }
//     });

//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Registration failed'
//     });
//   }
// });

// // Login
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide email and password'
//       });
//     }

//     // Find user
//     const user = await User.findByEmail(email);
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials'
//       });
//     }

//     // Check password
//     const isValidPassword = await bcrypt.compare(password, user.password);
//     if (!isValidPassword) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials'
//       });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { 
//         id: user.id, 
//         email: user.email, 
//         role: user.role,
//         name: user.name
//       },
//       process.env.JWT_SECRET || 'your-secret-key',
//       { expiresIn: '24h' }
//     );

//     res.json({
//       success: true,
//       message: 'Login successful',
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         avatar: user.avatar_url
//       }
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Login failed'
//     });
//   }
// });

// // Microsoft OAuth login
// router.post('/microsoft', async (req, res) => {
//   try {
//     const { accessToken, user } = req.body;
    
//     console.log('Microsoft OAuth request received');
//     console.log('Access token present:', !!accessToken);
//     console.log('User data:', user);
    
//     if (!accessToken || !user) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing access token or user data'
//       });
//     }

//     // Verify the Microsoft access token
//     try {
//       console.log('Verifying Microsoft access token...');
//       const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       console.log('Microsoft Graph API response:', response.data);
//       const microsoftUser = response.data;
      
//       // Check if user exists in our database
//       let existingUser = await User.findByEmail(microsoftUser.mail || microsoftUser.userPrincipalName);
      
//       console.log('Existing user found:', !!existingUser);
      
//       if (!existingUser) {
//         console.log('Creating new user from Microsoft account');
//         // Create new user
//         const userData = {
//           name: microsoftUser.displayName,
//           email: microsoftUser.mail || microsoftUser.userPrincipalName,
//           password: await bcrypt.hash('microsoft-oauth-' + Date.now(), 10), // Secure placeholder
//           role: 'voter',
//           microsoft_id: microsoftUser.id
//         };
        
//         const userId = await User.create(userData);
//         existingUser = await User.findById(userId);
//         console.log('New user created with ID:', userId);
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
      
//       console.log('JWT token generated successfully');
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
//       console.error('Microsoft token verification failed:', verifyError.response?.data || verifyError.message);
//       console.error('Status:', verifyError.response?.status);
//       console.error('Headers:', verifyError.response?.headers);
      
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid Microsoft access token',
//         details: verifyError.response?.data || verifyError.message
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

// // Microsoft OAuth login
// // router.post('/microsoft', async (req, res) => {
// //   try {
// //     const { accessToken, user } = req.body;
    
// //     if (!accessToken || !user) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Missing access token or user data'
// //       });
// //     }

// //     // Verify the Microsoft access token
// //     try {
// //       const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
// //         headers: {
// //           Authorization: `Bearer ${accessToken}`
// //         }
// //       });
      
// //       const microsoftUser = response.data;
      
// //       // Check if user exists in our database
// //       let existingUser = await User.findByEmail(microsoftUser.mail || microsoftUser.userPrincipalName);
      
// //       if (!existingUser) {
// //         // Create new user
// //         const userData = {
// //           name: microsoftUser.displayName,
// //           email: microsoftUser.mail || microsoftUser.userPrincipalName,
// //           password: 'microsoft-oauth', // Placeholder password
// //           role: 'voter',
// //           microsoft_id: microsoftUser.id
// //         };
        
// //         const userId = await User.create(userData);
// //         existingUser = await User.findById(userId);
// //       }
      
// //       // Generate JWT token
// //       const token = jwt.sign(
// //         { 
// //           id: existingUser.id, 
// //           email: existingUser.email, 
// //           role: existingUser.role,
// //           name: existingUser.name
// //         },
// //         process.env.JWT_SECRET || 'your-secret-key',
// //         { expiresIn: '24h' }
// //       );
      
// //       res.json({
// //         success: true,
// //         message: 'Microsoft login successful',
// //         token,
// //         user: {
// //           id: existingUser.id,
// //           name: existingUser.name,
// //           email: existingUser.email,
// //           role: existingUser.role,
// //           avatar: existingUser.avatar_url
// //         }
// //       });
      
// //     } catch (verifyError) {
// //       console.error('Microsoft token verification failed:', verifyError);
// //       return res.status(401).json({
// //         success: false,
// //         message: 'Invalid Microsoft access token'
// //       });
// //     }
    
// //   } catch (error) {
// //     console.error('Microsoft OAuth error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Microsoft authentication failed'
// //     });
// //   }
// // });




// // // Microsoft OAuth login
// // router.post('/microsoft', async (req, res) => {
// //   try {
// //     const { accessToken, user } = req.body;
    
// //     if (!accessToken || !user) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Missing access token or user data'
// //       });
// //     }

// //     // Verify the Microsoft access token
// //     try {
// //       const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
// //         headers: {
// //           Authorization: `Bearer ${accessToken}`
// //         }
// //       });
      
// //       const microsoftUser = response.data;
      
// //       // Check if user exists in our database
// //       let existingUser = await User.findByEmail(microsoftUser.mail || microsoftUser.userPrincipalName);
      
// //       if (!existingUser) {
// //         // Create new user
// //         const userData = {
// //           name: microsoftUser.displayName,
// //           email: microsoftUser.mail || microsoftUser.userPrincipalName,
// //           password: 'microsoft-oauth', // Placeholder password
// //           role: 'voter',
// //           microsoft_id: microsoftUser.id
// //         };
        
// //         const userId = await User.create(userData);
// //         existingUser = await User.findById(userId);
// //       }
      
// //       // Generate JWT token
// //       const token = jwt.sign(
// //         { 
// //           id: existingUser.id, 
// //           email: existingUser.email, 
// //           role: existingUser.role,
// //           name: existingUser.name
// //         },
// //         process.env.JWT_SECRET || 'your-secret-key',
// //         { expiresIn: '24h' }
// //       );
      
// //       res.json({
// //         success: true,
// //         message: 'Microsoft login successful',
// //         token,
// //         user: {
// //           id: existingUser.id,
// //           name: existingUser.name,
// //           email: existingUser.email,
// //           role: existingUser.role,
// //           avatar: existingUser.avatar_url
// //         }
// //       });
      
// //     } catch (verifyError) {
// //       console.error('Microsoft token verification failed:', verifyError);
// //       return res.status(401).json({
// //         success: false,
// //         message: 'Invalid Microsoft access token'
// //       });
// //     }
    
// //   } catch (error) {
// //     console.error('Microsoft OAuth error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Microsoft authentication failed'
// //     });
// //   }
// // });


// export default router;





