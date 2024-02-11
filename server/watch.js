const fs = require('fs');
const { spawn } = require('child_process');

fs.watch('server.js', (eventType, filename) => {
  console.log('Changes detected, restarting server...');
  const server = spawn('node', ['server.js'], { stdio: 'inherit' });
  server.on('close', (code) => {
    if (code === 8) {
      console.error('Error detected, restarting server...');
    }
  });
});
