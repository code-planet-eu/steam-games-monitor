const discord = require('discord.js')

const config = require('../../config/settings/config')
const sg = require('./steam_games')
const Games = require('../modules/games.model')
const { log } = require('./logger')

const _discord = {}

_discord.commands = []

_discord.commands.push({
  data: new discord.SlashCommandBuilder()
    .setName('gamesforuser')
    .setDescription('Response games package ids of given user.')
    .addStringOption(option => option.setName('steamid').setDescription('SteamId of the user you want to check'))
})

_discord.commands.push({
  data: new discord.SlashCommandBuilder().setName('currentgames').setDescription('Response actual games package ids.')
})

_discord.webhookClient = new discord.WebhookClient({
  id: config.discord.webhook_id,
  token: config.discord.webhook_token
})

_discord.client = new discord.Client({
  intents: [
    discord.GatewayIntentBits.Guilds,
    discord.GatewayIntentBits.GuildMessages,
    discord.GatewayIntentBits.MessageContent
  ]
})

_discord.client.on('ready', () => {
  log('Discord client ready', 'info', 'discord.log')
  try {
    _discord.commands.forEach(async command => {
      await _discord.client.application.commands.create(command.data)
    })

    _discord.client.user.setActivity('Steam Games', { type: 3 })
  } catch (err) {
    log(err, 'error', 'discord.log')
  }
})

_discord.client.on(discord.Events.InteractionCreate, async interaction => {
  if (!interaction.isCommand()) return
  if (interaction.channelId !== '1079157959050928328') {
    await interaction.reply({
      content: 'Sorry, this command can only be used in a specific channel.',
      ephemeral: true
    })
    return
  }

  const { commandName, options } = interaction
  const steamId = options.getString('steamid')
  // const afterOneHour = new Date().setHours(new Date().getHours() - 1)
  const after15Minutes = new Date().setMinutes(new Date().getMinutes() - 15)

  const games = await Games.find({ last_check: { $gte: after15Minutes } }).sort({ last_check: 1 })
  const packageIds = games.map(game => game.packages.map(p => p.packageid))
  const count = games.length
  const oldestTimeCheck = games[0]?.last_check

  if (commandName === 'currentgames') {
    const message = ` There are **${count}** games to check. The oldest game was checked at \`${oldestTimeCheck}\`\n\nhttps://store.steampowered.com/api/addtocart/?packageids=${packageIds.join(
      ','
    )}`
    const embed = new discord.EmbedBuilder().setDescription(packageIds.join(',')).setColor(16734410)

    await interaction.reply({
      content: message,
      embeds: [embed],
      ephemeral: true
    })
  }
  if (commandName === 'gamesforuser') {
    const userGames = await sg.getUserGames(steamId)
    const gamesToCheck = games.filter(game => !userGames.includes(game.appid))

    const message = `There are **${gamesToCheck?.length || 0}** games for this user. The oldest game was checked at \`${
      gamesToCheck[0]?.last_check
    }\`\n\nhttps://store.steampowered.com/api/addtocart/?packageids=${gamesToCheck
      .map(game => game.packages.map(p => p.packageid))
      .join(',')}`
    const embed = new discord.EmbedBuilder()
      .setDescription(gamesToCheck.map(game => game.packages.map(p => p.packageid)).join(',') || 'No games to check.')
      .setColor(16734410)

    await interaction.reply({
      content: message,
      embeds: [embed],
      ephemeral: true
    })
  }
})

_discord.init = async () => {
  _discord.client.login(config.discord.token)
}

_discord.setNewGamesActivity = async gamesCount => {
  const date = new Date()
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  _discord.client.user.setActivity(`${gamesCount} games - ${day}/${month}/${year} ${hours}:${minutes}:${seconds}`, {
    type: 3
  })
}

_discord.embedNewGame = async game => {
  const pakcageIds = game.packages.map(p => p.packageid).join(', ')
  const embed = new discord.EmbedBuilder()
    .setTitle(game.name)
    .setURL(game.header_image)
    .setColor(7602008)
    .addFields({
      name: `-${game.prices.discount}% Off 💸`,
      value: `*~~${game.prices.initial}~~* ➡️ **${game.prices.final}**`
    })
    .addFields({ name: 'Packages ID', value: pakcageIds })
    .addFields({
      name: 'Add to cart',
      value: `[link](https://store.steampowered.com/api/addtocart/?packageids=${pakcageIds})`
    })
    .addFields({
      name: 'Categories',
      value: `${game.card_drop ? 'Steam Trading Cards ✅' : 'Steam Trading Cards ❌'}`
    })
    .setThumbnail(game.header_image)

  _discord.webhookClient.send({
    embeds: [embed]
  })
}

module.exports = _discord
