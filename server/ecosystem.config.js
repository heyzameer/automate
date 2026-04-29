module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: 'dist/main.js',
      cwd: './services/api-gateway',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'auth-service',
      script: 'dist/main.js',
      cwd: './services/auth-service',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'inventory-service',
      script: 'dist/main.js',
      cwd: './services/inventory-service',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'whatsapp-bot',
      script: 'dist/main.js',
      cwd: './services/whatsapp-bot-service',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'billing-service',
      script: 'dist/main.js',
      cwd: './services/billing-service',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'notification-service',
      script: 'dist/main.js',
      cwd: './services/notification-service',
      env: { NODE_ENV: 'production' }
    }
  ]
};
