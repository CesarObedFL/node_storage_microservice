module.exports = {
  apps: [
    {
      name: 'storage_microservice',
      script: './server.js',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      env_file: './config/.env',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};