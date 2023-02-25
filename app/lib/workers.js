// const request = require('request')
const { log } = require('./logger')

const workers = {}

workers.init = async () => {
  log('Starting workers...')
}

module.exports = workers
