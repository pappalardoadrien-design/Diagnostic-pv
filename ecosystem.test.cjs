module.exports = {
  apps: [
    {
      name: 'diagnostic-hub-prod',
      script: 'npx',
      args: 'wrangler pages dev dist --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'diagnostic-hub-audit-test',
      script: 'npx',
      args: 'wrangler pages dev dist-audit --ip 0.0.0.0 --port 3002',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
