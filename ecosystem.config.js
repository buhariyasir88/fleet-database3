// ecosystem.config.js (Windows Compatible)
module.exports = {
  apps: [
    {
      name: 'fleet-backend',
      cwd: './backend',
      script: 'node',
      args: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5005
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log'
    },
    {
      name: 'fleet-frontend',
      cwd: './frontend',
      script: 'node',
      args: 'node_modules/react-scripts/scripts/start.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        BROWSER: 'none',
        CI: 'true'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log'
    }
  ]
};