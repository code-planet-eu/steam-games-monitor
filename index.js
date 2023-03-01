const mongoose = require('mongoose')

const workers = require('./app/lib/workers')
const config = require('./config/settings/config')
const { log } = require('./app/lib/logger')
const _discord = require('./app/lib/discord')

const app = {}

app.init = async () => {
  mongoose.set('strictQuery', true)
  try {
    await mongoose.connect(config.mongo_uri, { useNewUrlParser: true, useUnifiedTopology: true })
    log('Connected to MongoDB', 'info', 'mongo.log')
  } catch (err) {
    log(err, 'error', 'mongo.log')

    process.exit(1)
  }

  log('App started')
  await _discord.init()
  await workers.init()
}

const start = async () => {
  log('Starting app...')

  await app.init()
}

start()
