module.exports = {
  apps: [
    {
      name: 'node_storage_microservice',
      script: './server.js',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3100,
        STORAGE_PATH: './storage',
        MASTER_TOKEN: '%cho8AdminToken&31231mkfasdoiff%'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3100,
        STORAGE_PATH: './storage',
        MASTER_TOKEN: '%cho8AdminToken&31231mkfasdoiff%'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};