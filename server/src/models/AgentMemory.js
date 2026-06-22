const mongoose = require('mongoose');
const { inMemoryStore } = require('../config/db');

const agentMemorySchema = new mongoose.Schema({
  workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  execution: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution', required: true },
  agent: { type: String, required: true },
  memory: { type: mongoose.Schema.Types.Mixed, default: {} },
  confidence: { type: Number, default: 1.0 },
}, { timestamps: true });

class InMemoryAgentMemory {
  constructor() { this.col = 'agentMemory'; }

  async create(data) {
    const store = inMemoryStore.getCollection(this.col);
    const doc = {
      _id: new mongoose.Types.ObjectId().toString(),
      workflow: data.workflow,
      execution: data.execution,
      agent: data.agent,
      memory: data.memory || {},
      confidence: data.confidence !== undefined ? data.confidence : 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.push(doc);
    return { ...doc };
  }

  async findOne(query = {}) {
    const store = inMemoryStore.getCollection(this.col);
    let results = [...store];
    if (query.execution) results = results.filter(m => m.execution === query.execution);
    if (query.agent) results = results.filter(m => m.agent === query.agent);
    return results[0] || null;
  }

  async findByIdAndUpdate(id, update) {
    const store = inMemoryStore.getCollection(this.col);
    const idx = store.findIndex(m => m._id === id);
    if (idx === -1) return null;
    const sets = update.$set || update;
    Object.assign(store[idx], sets, { updatedAt: new Date() });
    return { ...store[idx] };
  }

  async findOneAndUpdate(query, update, options = {}) {
    let doc = await this.findOne(query);
    if (!doc && options.upsert) {
      doc = await this.create({
        workflow: query.workflow,
        execution: query.execution,
        agent: query.agent,
        ...update.$setOnInsert
      });
    }
    if (doc) {
      const store = inMemoryStore.getCollection(this.col);
      const idx = store.findIndex(m => m._id === doc._id);
      if (idx !== -1) {
        const sets = update.$set || update;
        Object.assign(store[idx], sets, { updatedAt: new Date() });
        return { ...store[idx] };
      }
    }
    return null;
  }
}

function getAgentMemoryModel() {
  if (inMemoryStore.enabled) return new InMemoryAgentMemory();
  return mongoose.models.AgentMemory || mongoose.model('AgentMemory', agentMemorySchema);
}

module.exports = { agentMemorySchema, getAgentMemoryModel, InMemoryAgentMemory };
