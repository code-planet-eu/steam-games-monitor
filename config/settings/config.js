const config = {}

config.mongo_uri = process.env.MONGO_URI || 'mongodb://localhost:1339/steam-games-monitor'

config.query =
  process.env.QUERY ||
  '?sort_by=Price_ASC&maxprice=70&category1=998%2C994%2C992&category2=29&specials=1&ignore_preferences=1&cc=ar&count=100'

module.exports = config
