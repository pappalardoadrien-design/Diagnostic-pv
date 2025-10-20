module.exports = {
  apps: [
    {
      name: 'diagnostic-hub',
      script: 'npx',
      args: 'wrangler dev --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false, // Disable PM2 file monitoring (wrangler handles hot reload)
      instances: 1, // Development mode uses only one instance
      exec_mode: 'fork'
    }
  ]
}