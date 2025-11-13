const session = require('express-session');

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'educard.sid' // Custom session cookie name
};

// For production, use database session store
// const SequelizeStore = require('connect-session-sequelize')(session.Store);
// const { sequelize } = require('./database');
// sessionConfig.store = new SequelizeStore({ 
//   db: sequelize,
//   checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
//   expiration: 24 * 60 * 60 * 1000 // 24 hours
// });

module.exports = session(sessionConfig);
