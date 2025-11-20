/**
 * Logger Utility - Professional Logging Service
 * Replace all console.log statements with this
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  formatMessage(level, message, meta) {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
  }

  error(message, error = null) {
    const errorDetails = error ? {
      message: error.message,
      stack: error.stack,
      ...error
    } : null;
    
    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, errorDetails));
    
    // In production, send to logging service (Sentry, LogRocket, etc.)
    if (!this.isDevelopment && errorDetails) {
      // this.sendToErrorTracking(message, errorDetails);
    }
  }

  warn(message, meta = null) {
    if (this.isDevelopment) {
      console.warn(this.formatMessage(LOG_LEVELS.WARN, message, meta));
    }
  }

  info(message, meta = null) {
    if (this.isDevelopment) {
      console.info(this.formatMessage(LOG_LEVELS.INFO, message, meta));
    }
  }

  debug(message, meta = null) {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  // Specialized loggers for API requests
  apiRequest(method, url, data = null) {
    this.info(`API Request: ${method} ${url}`, data);
  }

  apiResponse(method, url, status, data = null) {
    this.info(`API Response: ${method} ${url} - ${status}`, data);
  }

  // Database query logger
  dbQuery(query, params = null) {
    this.debug(`DB Query: ${query}`, params);
  }
}

export default new Logger();
