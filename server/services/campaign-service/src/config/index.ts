export default {
    port: process.env.PORT || 5005,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/carbot_campaigns',
    botServiceUrl: process.env.BOT_SERVICE_URL || 'http://localhost:3003',
    internalSecret: process.env.INTERNAL_SECRET || 'carbot-internal-super-secret'
};
