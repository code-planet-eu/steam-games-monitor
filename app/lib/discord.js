const discord = require('discord.js')

const config = require('../../config/settings/config')
const Games = require('../modules/games.model')
const { log } = require('./logger')

const _discord = {}

_discord.commands = []

_discord.commands.push({
  data: new discord.SlashCommandBuilder()
    .setName('gamesforuser')
    .setDescription('Response games package ids of given user.')
    .addNumberOption(option => option.setName('steamid').setDescription('SteamId of the user you want to check'))
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

  const { commandName } = interaction
  // const steamId = options.getNumber('steamid')
  const afterOneHour = new Date().setHours(new Date().getHours() - 1)

  const games = await Games.find({ last_check: { $gte: afterOneHour } }).sort({ last_check: 1 })
  const packageIds = games.map(game => game.packages.map(p => p.packageid)).join(',')
  const count = games.length
  const oldestTimeCheck = games[0]?.last_check

  if (commandName === 'currentgames') {
    const message = `There are **${count}** games to check. The oldest game was checked at \`${oldestTimeCheck}\`\n\nhttps://store.steampowered.com/api/addtocart/?packageids=${packageIds}`
    const embed = new discord.EmbedBuilder().setDescription(packageIds).setColor(16734410)

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
