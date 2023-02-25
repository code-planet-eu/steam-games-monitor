// Import required modules
const workers = require('./app/lib/workers')
const { log } = require('./app/lib/logger')

const app = {}

app.init = async () => {
  await workers.init()

  log('App started')
}

const start = async () => {
  log('Starting app...')

  await app.init()
}

start()
