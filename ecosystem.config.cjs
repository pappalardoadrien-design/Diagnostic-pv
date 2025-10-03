// ecosystem.config.cjs - Configuration PM2 pour DiagPV Audit
module.exports = {
  apps: [
    {
      name: 'diagpv-audit',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=diagpv-audit-production --local --ip 0.0.0.0 --port 3000',
      cwd: '/home/user/webapp',
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