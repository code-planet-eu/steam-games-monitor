const config = {}

config.mongo_uri = process.env.MONGO_URI || 'mongodb://localhost:1339/steam-games-monitor'

module.exports = config
