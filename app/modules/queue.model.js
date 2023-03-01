const mongoose = require('mongoose')

const { Schema } = mongoose

const queueSchema = new Schema(
  {
    appid: { type: Number, required: true },
    price: { type: Number, required: true },
    state: { type: String, required: true, default: 'pending' }
  },
  {
    timestamps: true
  }
)

const Queue = mongoose.model('Queue', queueSchema)

module.exports = Queue
