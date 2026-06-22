const mongoose = require('mongoose');
const env = require('./env');

// ── In-Memory Store Fallback ──────────────────────────────────────────
// When MONGO_URI is not set or connection fails, we use a simple
// in-memory data store so the app can still boot for local dev.

const inMemoryCollections = {};

const inMemoryStore = {
  _enabled: false,
  get enabled() { return this._enabled; },

  getCollection(name) {
    if (!inMemoryCollections[name]) {
      inMemoryCollections[name] = [];
    }
    return inMemoryCollections[name];
  },

  clearAll() {
    Object.keys(inMemoryCollections).forEach(k => {
      inMemoryCollections[k] = [];
    });
  }
};

async function connectDB() {
  if (!env.MONGO_URI) {
    console.log('⚠️  MONGO_URI not set – running with in-memory store');
    inMemoryStore._enabled = true;
    return null;
  }

  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      // Mongoose 8 defaults are fine
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.log('⚠️  Falling back to in-memory store');
    inMemoryStore._enabled = true;
    return null;
  }
}

module.exports = { connectDB, inMemoryStore };
