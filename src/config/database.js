require('dotenv').config();
const { Sequelize } = require('sequelize');

// Query logging function for development
const logQuery = (sql, timing) => {
  const queryTime = timing ? ` (${timing}ms)` : '';
  
  // Color code by query type
  let color = '\x1b[0m'; // Reset
  if (sql.startsWith('SELECT')) color = '\x1b[36m'; // Cyan
  else if (sql.startsWith('INSERT')) color = '\x1b[32m'; // Green
  else if (sql.startsWith('UPDATE')) color = '\x1b[33m'; // Yellow
  else if (sql.startsWith('DELETE')) color = '\x1b[31m'; // Red
  
  // Warn on slow queries (>100ms)
  const slowQuery = timing && timing > 100 ? ' ⚠️  SLOW QUERY' : '';
  
  console.log(`${color}[DB]${queryTime}${slowQuery}\x1b[0m ${sql.substring(0, 200)}${sql.length > 200 ? '...' : ''}`);
};

// Database configuration object (for Sequelize CLI)
const config = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: logQuery,
    benchmark: true, // Show query execution time
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // Add statement timeout to prevent long-running queries
      statement_timeout: 10000 // 10 seconds
    }
  },
  test: {
    username: process.env.DB_USER || 'educard_user',
    password: process.env.DB_PASSWORD || 'securepassword',
    database: process.env.DB_NAME || 'educard_db',
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Disable logging in tests
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};

// Sequelize instance
const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(config[env]);

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    return false;
  }
}

module.exports = { sequelize, testConnection };
// Export config for Sequelize CLI
module.exports.development = config.development;
module.exports.test = config.test;
module.exports.production = config.production;
