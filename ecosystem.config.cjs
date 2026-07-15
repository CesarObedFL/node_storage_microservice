/**
 * PM2 configuration file for the Storage Microservice.
 * Used to start, manage, and monitor the application in production.
 *
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 */
module.exports = {
  apps: [
    {
      name: 'node_storage_microservice',
      script: './server.js',
      instances: 1,              // Número de instancias (1 para simple, o 'max' para clustering)
      exec_mode: 'fork',         // 'fork' o 'cluster' (usar 'cluster' si se necesita escalar)
      watch: false,              // No reiniciar en cambios (para producción)
      ignore_watch: ['node_modules', 'storage', 'logs'],
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_example: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
};