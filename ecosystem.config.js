module.exports = {
  apps: [
    {
      name: 'node_storage_microservice',
      script: './server.js',
      watch: true,
      env: {
        NODE_ENV: 'production',
        PORT: "4000",
      }
    }
  ]
};