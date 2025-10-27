// ecosystem.config.cjs - Configuration PM2 pour DiagPV Audit
module.exports = {
  apps: [
    {
      name: 'diagnostic-hub',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=diagnostic-hub-production --local --ip 0.0.0.0 --port 3000',
      cwd: '/home/user/diagnostic-hub',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false, // Disable PM2 file monitoring (wrangler handles hot reload)
      instances: 1, // Development mode uses only one instance
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G'
    }
  ]
}