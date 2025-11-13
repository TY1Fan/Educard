// Server entry point for Educard Forum
const app = require('./src/app');

// Get port from environment or use default
const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  console.log('=====================================');
  console.log('🎓 Educard Forum Server');
  console.log('=====================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server running on port: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('=====================================');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use`);
    console.error('Please close the other application or use a different port');
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n📛 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n📛 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});
