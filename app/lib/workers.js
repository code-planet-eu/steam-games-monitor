const { log } = require('./logger')
const sg = require('./steam_games')
const config = require('../../config/settings/config')

const Queue = require('../modules/queue.model')
const _discord = require('./discord')
const Games = require('../modules/games.model')

const workers = {}

workers.init = async () => {
  log('Starting workers...')
  workers.deleteOldRecords()
  workers.refreshGames(10)
  workers.processQueue()
}

workers.refreshGames = async interval => {
  let page = 1

  const fetchData = async () => {
    const { next_page } = await sg.getStoreSearchResults(config.query, page)
    page = next_page
  }

  if (interval) {
    setInterval(fetchData, 1000 * 60 * interval)
  } else {
    await fetchData()
  }
}

workers.processQueue = async () => {
  const nextItem = async () => {
    const item = await Queue.findOne({ state: 'pending' }).sort({ createdAt: 1 })

    if (item) {
      await item.updateOne({ state: 'processing' })

      await sg.getGameDetails(item.appid)

      await item.updateOne({ state: 'done' })
    }
  }

  setInterval(nextItem, 1000 * 2)
}

workers.deleteOldRecords = async () => {
  const oneDayAgo = new Date().setDate(new Date().getDate() - 1)
  const query = { createdAt: { $lt: oneDayAgo }, state: 'done' }

  const deleteItems = async () => {
    const count = await Queue.countDocuments(query)
    const countOfGames = await Games.countDocuments({ last_check: { $lt: oneDayAgo } })
    await Queue.deleteMany(query)
    await Games.deleteMany({ last_check: { $lt: oneDayAgo } })

    log(`Deleted ${count} items`, 'info', 'workers.log')
    log(`Deleted ${countOfGames} games`, 'info', 'workers.log')
  }

  setInterval(deleteItems, 1000 * 60 * 60 * 24)
}

sg.on('StoreSearchResults', async ({ results, count, page }) => {
  log(`Got ${count} results from page ${page}`, 'info', 'workers.log')
  results.forEach(result => {
    const queue = new Queue(result)
    queue.save()
  })
})

sg.on('newGame', async ({ appid, name, header_image, type, card_drop, prices, packages }) => {
  log(
    `Got details for ${name} (${appid}) | ${prices.initial} - (${prices.discount}) => ${prices.final}`,
    'info',
    'workers.log'
  )
  _discord.embedNewGame({ appid, name, header_image, type, card_drop, prices, packages })
})

module.exports = workers
