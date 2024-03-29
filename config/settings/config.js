const config = {}

config.mongo_uri = process.env.MONGO_URI || 'mongodb://localhost:1339/steam-games-monitor'

config.query = process.env.QUERY || 'xxxxxxxx'

config.discord = {
  webhook_id: process.env.DISCORD_WEBHOOK_ID || 'xxxxx',
  webhook_token: process.env.DISCORD_WEBHOOK_TOKEN || 'xxxxxxxxxxxxxx',
  token: process.env.DISCORD_TOKEN || 'xxxxxxxxxxxx'
}

config.steam_api_key = process.env.STEAM_API_KEY || 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

module.exports = config
