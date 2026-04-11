export default {
    port: process.env.PORT || 5006,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/carbot_notifications',
    botServiceUrl: process.env.BOT_SERVICE_URL || 'http://localhost:3003',
    internalSecret: process.env.INTERNAL_SECRET || 'carbot-internal-super-secret'
};
