const mongoose = require('mongoose')

mongoose.set('strictQuery', true)

async function connectDB(mongoUri) {
  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI in environment')
  }

  const conn = await mongoose.connect(mongoUri)
  return conn
}

module.exports = { connectDB }
