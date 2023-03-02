const event = require('events')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const { log } = require('./logger')
const Games = require('../modules/games.model')
const config = require('../../config/settings/config')

const sg = new event.EventEmitter()

sg.getStoreSearchResults = async (query, page) => {
  const results = []
  try {
    const url = `https://store.steampowered.com/search/results${query}&page=${page}`
    const request = await fetch(url)
    const $ = cheerio.load(await request.text())

    $('.search_result_row').each((i, el) => {
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

sg.getUserGames = async steamid => {
  let games = []

  try {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1?key=${config.steam_api_key}&steamid=${steamid}`
    const request = await fetch(url)
    const data = await request.json().then(data => data.response.games)
    games = data.map(game => game.appid)
  } catch (err) {
    log(err, 'error', 'steam_games.log')
  }

  return games
}

sg.getGameDetails = async appid => {
  const result = {
    packages: []
  }

  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=ar`
    const request = await fetch(url)
    const data = await request.json().then(data => data[appid].data)

    data.package_groups.forEach(group => {
      group.subs.forEach(sub => {
        if (sub.price_in_cents_with_discount <= 500)
          result.packages.push({
            packageid: sub.packageid,
            price: sub.price_in_cents_with_discount,
            discount: sub.percent_savings_text
          })
      })
    })

    result.name = data.name
    result.appid = appid
    result.header_image = data.header_image
    result.type = data.type
    result.card_drop = !!data.categories.find(cat => cat.id === 29)
    result.prices = {
      initial: data.price_overview.initial_formatted,
      final: data.price_overview.final_formatted,
      discount: data.price_overview.discount_percent
    }

    const inDB = await Games.findOne({ appid: result.appid })

    await inDB?.updateOne({ last_check: Date.now() })

    if (!inDB) {
      const record = new Games(result)
      record.last_check = Date.now()
      await record.save()
      sg.emit('newGame', result)
    }
  } catch (err) {
    log(err, 'error', 'steam_games.log')
  }
}

module.exports = sg
