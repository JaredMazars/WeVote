// =====================================================
// Main Server File
// =====================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const logger = require('./config/logger');
const { healthCheck } = require('./config/database');

// Create Express app
const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

// CORS - Must be before helmet for preflight requests
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Security - Configure helmet to work with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Rate limiting - ENABLED for security (relaxed for development)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased to 1000 for development
  message: { error: 'Too many requests from this IP, please try again later.' }, // JSON format
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  }
});

app.use('/api', limiter);

// =====================================================
// ROUTES
// =====================================================

// Health check
app.get('/health', async (req, res) => {
  const dbHealthy = await healthCheck();
  
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));

// Protected routes (require authentication)
app.use('/api/sessions', authenticateToken, require('./routes/sessions'));
app.use('/api/votes', authenticateToken, require('./routes/votes'));
app.use('/api/users', authenticateToken, require('./routes/users'));
app.use('/api/candidates', authenticateToken, require('./routes/candidates'));
app.use('/api/resolutions', authenticateToken, require('./routes/resolutions'));
app.use('/api/employees', authenticateToken, require('./routes/employees'));
app.use('/api/proxy', authenticateToken, require('./routes/proxy'));
app.use('/api/organizations', authenticateToken, require('./routes/organizations'));
app.use('/api/departments', authenticateToken, require('./routes/departments'));
app.use('/api/attendance', authenticateToken, require('./routes/attendance'));
app.use('/api/allocations', authenticateToken, require('./routes/allocations'));
app.use('/api/whatsapp', authenticateToken, require('./routes/whatsapp'));
app.use('/api/blockchain', authenticateToken, require('./routes/blockchain'));
app.use('/api/audit-logs', authenticateToken, require('./routes/audit'));
app.use('/api/vote-splitting', authenticateToken, require('./routes/voteSplitting'));
app.use('/api/notifications', authenticateToken, require('./routes/notifications'));

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// =====================================================
// SERVER START
// =====================================================

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔐 API endpoint: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = app; // For testing
