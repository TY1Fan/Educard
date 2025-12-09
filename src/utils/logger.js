const logger = {
  // Log levels
  LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    SECURITY: 'security'
  },

  // Security event types
  SECURITY_EVENTS: {
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILURE: 'login_failure',
    LOGOUT: 'logout',
    REGISTER: 'register',
    PASSWORD_CHANGE: 'password_change',
    UNAUTHORIZED_ACCESS: 'unauthorized_access',
    CSRF_VIOLATION: 'csrf_violation',
    XSS_ATTEMPT: 'xss_attempt',
    SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    INVALID_INPUT: 'invalid_input',
    ADMIN_ACTION: 'admin_action',
    PERMISSION_DENIED: 'permission_denied',
    SESSION_HIJACK_ATTEMPT: 'session_hijack_attempt'
  },

  // Format log message
  _formatLog(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      message,
      ...metadata,
      // Add additional context
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid
    };
  },

  // Log to console (in production, this should go to a proper logging service)
  _write(logEntry) {
    const logString = JSON.stringify(logEntry);
    
    // In development, pretty print
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${logEntry.timestamp}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`);
      if (Object.keys(logEntry).length > 5) {
        console.log('  Metadata:', JSON.stringify({
          ...logEntry,
          timestamp: undefined,
          level: undefined,
          message: undefined,
          environment: undefined,
          pid: undefined
        }, null, 2));
      }
    } else {
      // In production, log as JSON for parsing
      console.log(logString);
    }
  },

  // General logging methods
  error(message, metadata = {}) {
    this._write(this._formatLog(this.LEVELS.ERROR, message, metadata));
  },

  warn(message, metadata = {}) {
    this._write(this._formatLog(this.LEVELS.WARN, message, metadata));
  },

  info(message, metadata = {}) {
    this._write(this._formatLog(this.LEVELS.INFO, message, metadata));
  },

  debug(message, metadata = {}) {
    if (process.env.NODE_ENV === 'development') {
      this._write(this._formatLog(this.LEVELS.DEBUG, message, metadata));
    }
  },

  // Security-specific logging
  security(eventType, message, req, additionalMetadata = {}) {
    const metadata = {
      event_type: eventType,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      user_id: req.user ? req.user.id : null,
      username: req.user ? req.user.username : null,
      url: req.originalUrl,
      method: req.method,
      ...additionalMetadata
    };

    this._write(this._formatLog(this.LEVELS.SECURITY, message, metadata));

    // Alert on critical security events
    this._alertOnCriticalEvent(eventType, metadata);
  },

  // Alert on critical security events
  _alertOnCriticalEvent(eventType, metadata) {
    const criticalEvents = [
      this.SECURITY_EVENTS.CSRF_VIOLATION,
      this.SECURITY_EVENTS.XSS_ATTEMPT,
      this.SECURITY_EVENTS.SQL_INJECTION_ATTEMPT,
      this.SECURITY_EVENTS.SESSION_HIJACK_ATTEMPT,
      this.SECURITY_EVENTS.UNAUTHORIZED_ACCESS
    ];

    if (criticalEvents.includes(eventType)) {
      // In production, this should send alerts (email, Slack, PagerDuty, etc.)
      console.error(`🚨 CRITICAL SECURITY EVENT: ${eventType}`, metadata);
    }
  },

  // Track failed login attempts for brute force detection
  _failedLoginAttempts: new Map(),
  
  trackFailedLogin(identifier, req) {
    const key = identifier.toLowerCase();
    const attempts = this._failedLoginAttempts.get(key) || [];
    attempts.push({
      timestamp: Date.now(),
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Keep only last 10 attempts
    if (attempts.length > 10) {
      attempts.shift();
    }

    this._failedLoginAttempts.set(key, attempts);

    // Check for brute force
    const recentAttempts = attempts.filter(a => Date.now() - a.timestamp < 15 * 60 * 1000); // 15 minutes
    if (recentAttempts.length >= 5) {
      this.security(
        this.SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
        `Possible brute force attack detected for: ${identifier}`,
        req,
        { failed_attempts: recentAttempts.length }
      );
    }
  },

  clearFailedLogins(identifier) {
    this._failedLoginAttempts.delete(identifier.toLowerCase());
  },

  // Audit trail for admin actions
  auditAdmin(action, req, details = {}) {
    this.security(
      this.SECURITY_EVENTS.ADMIN_ACTION,
      `Admin action: ${action}`,
      req,
      {
        action,
        admin_role: req.user ? req.user.role : null,
        ...details
      }
    );
  }
};

module.exports = logger;
