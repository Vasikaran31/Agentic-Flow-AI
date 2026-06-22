const mongoose = require('mongoose');
const { inMemoryStore } = require('../config/db');

const integrationSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: {
    type: String,
    enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
    required: true,
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected'],
    default: 'connected',
  },
  scopes: { type: [String], default: [] },
  accessToken: { type: String, default: null }, // Encrypted at rest
  refreshToken: { type: String, default: null }, // Encrypted at rest
  expiresAt: { type: Date, default: null },
  error: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

class InMemoryIntegration {
  constructor() { this.col = 'integrations'; }

  async create(data) {
    const store = inMemoryStore.getCollection(this.col);
    const doc = {
      _id: new mongoose.Types.ObjectId().toString(),
      owner: data.owner,
      provider: data.provider,
      status: data.status || 'connected',
      scopes: data.scopes || [],
      accessToken: data.accessToken || null,
      refreshToken: data.refreshToken || null,
      expiresAt: data.expiresAt || null,
      error: data.error || null,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.push(doc);
    return { ...doc };
  }

  async find(query = {}) {
    const store = inMemoryStore.getCollection(this.col);
    let results = [...store];
    if (query.owner) results = results.filter(i => i.owner === query.owner);
    if (query.provider) results = results.filter(i => i.provider === query.provider);
    if (query.status) results = results.filter(i => i.status === query.status);
    return results;
  }

  async findOne(query = {}) {
    const results = await this.find(query);
    return results[0] || null;
  }

  async findById(id) {
    const store = inMemoryStore.getCollection(this.col);
    return store.find(i => i._id === id) || null;
  }

  async findByIdAndUpdate(id, update) {
    const store = inMemoryStore.getCollection(this.col);
    const idx = store.findIndex(i => i._id === id);
    if (idx === -1) return null;
    const sets = update.$set || update;
    Object.assign(store[idx], sets, { updatedAt: new Date() });
    return { ...store[idx] };
  }

  async findOneAndDelete(query = {}) {
    const store = inMemoryStore.getCollection(this.col);
    const results = await this.find(query);
    if (results.length === 0) return null;
    const item = results[0];
    const idx = store.findIndex(i => i._id === item._id);
    if (idx !== -1) {
      store.splice(idx, 1);
    }
    return item;
  }
}

function getIntegrationModel() {
  if (inMemoryStore.enabled) return new InMemoryIntegration();
  return mongoose.models.Integration || mongoose.model('Integration', integrationSchema);
}

module.exports = { integrationSchema, getIntegrationModel, InMemoryIntegration };
