const event = require('events')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const { log } = require('./logger')

const sg = new event.EventEmitter()

sg.getStoreSearchResults = async (query, page) => {
  const results = []
  try {
    const url = `https://store.steampowered.com/search/results${query}&page=${page}`
    const request = await fetch(url)
    const $ = cheerio.load(await request.text())

    $('.search_result_row ').each((i, el) => {
      const appid = $(el).attr('data-ds-appid')
      const price = $(el).find('.search_price_discount_combined').attr('data-price-final')
      if (price <= 500) results.push({ appid, price })
    })
  } catch (err) {
    log(err, 'error', 'steam_games.log')
  }
  const count = results.length
  const next_page = results.length === 100 ? page + 1 : 1

  sg.emit('StoreSearchResults', { results, count, next_page, page })
  return { results, count, next_page, page }
}

module.exports = sg
