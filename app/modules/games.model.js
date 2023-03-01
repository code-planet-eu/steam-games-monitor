const mongoose = require('mongoose')

const { Schema } = mongoose

const gamesSchema = new Schema(
  {
    name: { type: String, required: true },
    appid: { type: Number, required: true },
    header_image: { type: String, required: true },
    type: { type: String, required: true },
    prices: {
      initial: { type: String, required: true },
      final: { type: String, required: true },
      discount: { type: Number, required: true }
    },
    card_drop: { type: Boolean, required: true },
    packages: [
      {
        packageid: { type: Number, required: true },
        price: { type: Number, required: true },
        discount: { type: String, required: true }
      }
    ],
    last_check: { type: Date, required: true }
  },
  {
    timestamps: true
  }
)

const Games = mongoose.model('Games', gamesSchema)

module.exports = Games
