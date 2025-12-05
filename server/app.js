import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import employeesRoutes from './routes/employees.js';
import resolutionsRoutes from './routes/resolutions.js';
import adminRoutes from './routes/admin.js';
import superAdminRoutes from './routes/superadmin.js';
import whatsappRouter from './models/whatsappRouter.js';
import proxyRoutes from './routes/proxy.js';
import regRoutes from './routes/reg.js';
import approvalRoutes from './routes/approval.js';
import votingStatusRoutes from './routes/voting-status.js';
import auditLogsRoutes from './routes/audit-logs.js';
// import proxyFormsRoutes from './routes/proxyForms.js';
import './config/database.js'; // Ensure database connection is established
import './middleware/auth.js'; // Ensure auth middleware is loaded
dotenv.config();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('📁 Static files served from:', path.join(__dirname, 'uploads'));

// Logging middleware
app.use(morgan('combined'));

// Trust proxy
app.set('trust proxy', 1);

// Malformed route detection middleware
app.use((req, res, next) => {
  if (req.originalUrl.includes('/:')) {
    console.error('Malformed route detected:', req.originalUrl);
  }
  next();
});

// Routes - Order matters!
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/resolutions', resolutionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/voting-status', votingStatusRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/whatsapp', whatsappRouter);
app.use('/api/employees/webhook', employeesRoutes); // WhatsApp webhook
app.use('/api/proxy', proxyRoutes);
app.use('/api/reg', regRoutes);
app.use('/api/approval', approvalRoutes);
// app.use('/api/proxy-forms', proxyFormsRoutes); // Proxy forms


// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Voting Platform API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message }),
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Voting Platform API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;