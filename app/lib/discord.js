const discord = require('discord.js');

const config = require('../../config/settings/config');

const _discord = {}

_discord.webhookClient = new discord.WebhookClient({
    id: config.discord.webhook_id,
    token: config.discord.webhook_token
});

_discord.client = new discord.Client({
    intents: [discord.GatewayIntentBits.Guilds, discord.GatewayIntentBits.GuildMessages, discord.GatewayIntentBits.MessageContent]
});

_discord.init = async () => {
_discord.client.login(config.discord.token);

    _discord.client.on("ready", () => {
        console.log(`Logged in as ${_discord.client.user.tag}!`)
      })
}

_discord.embedNewGame = async game => {
    const pakcageIds = game.packages.map(p => p.packageid).join(', ')
    const embed = new discord.EmbedBuilder()
        .setTitle(game.name)
        .setURL(`https://store.steampowered.com/app/${game.appid}/${game.name.replace(/\s/g, '_')}/`)
        .setColor(7602008)
        .addFields({name:`-${game.prices.discount}% Off 💸`, value:`*~~${game.prices.initial}~~* ➡️ **${game.prices.final}**`})
        .addFields({name:'Packages ID',value: pakcageIds})
        .addFields({name:'Add to cart',value: `[link](https://store.steampowered.com/api/addtocart/?packageids=${pakcageIds})`})
        .addFields({name:'Categories',value: `${game.card_drop ? 'Steam Trading Cards ✅' : 'Steam Trading Cards ❌'}`})
        .setThumbnail(game.header_image)

    _discord.webhookClient.send({
        embeds: [embed]
    })
}

module.exports = _discord;