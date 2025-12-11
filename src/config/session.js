const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('./database');

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: true, // Changed to true so CSRF tokens work properly
  cookie: {
    httpOnly: true,
    secure: false, // Set to false for localhost testing
    sameSite: 'lax', // Helps with Chrome cookie handling
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'educard.sid', // Custom session cookie name
  store: new SequelizeStore({ 
    db: sequelize,
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
    expiration: 24 * 60 * 60 * 1000 // 24 hours
  })
};

// Create session table
sessionConfig.store.sync();

module.exports = session(sessionConfig);
