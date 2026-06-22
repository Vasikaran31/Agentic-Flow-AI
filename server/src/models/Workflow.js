const mongoose = require('mongoose');
const { inMemoryStore } = require('../config/db');

const workflowSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft',
  },
  trigger: {
    type: { type: String, default: 'manual' },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  nodes: { type: Array, default: [] },
  edges: { type: Array, default: [] },
  version: { type: Number, default: 1 },
  tags: { type: [String], default: [] },
  lastExecutedAt: { type: Date, default: null },
  executionCount: { type: Number, default: 0 },
}, { timestamps: true });

// ── In-Memory Fallback ────────────────────────────────────────────────
class InMemoryWorkflow {
  constructor() { this.col = 'workflows'; }

  async create(data) {
    const store = inMemoryStore.getCollection(this.col);
    const doc = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: data.name || 'Untitled Workflow',
      description: data.description || '',
      owner: data.owner,
      status: data.status || 'draft',
      trigger: data.trigger || { type: 'manual', config: {} },
      nodes: data.nodes || [],
      edges: data.edges || [],
      version: data.version || 1,
      tags: data.tags || [],
      lastExecutedAt: null,
      executionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.push(doc);
    return { ...doc };
  }

  async find(query = {}) {
    const store = inMemoryStore.getCollection(this.col);
    let results = [...store];
    if (query.owner) results = results.filter(w => w.owner === query.owner);
    if (query.status) results = results.filter(w => w.status === query.status);
    return results;
  }

  async findById(id) {
    const store = inMemoryStore.getCollection(this.col);
    return store.find(w => w._id === id) || null;
  }

  async findByIdAndUpdate(id, update, opts = {}) {
    const store = inMemoryStore.getCollection(this.col);
    const idx = store.findIndex(w => w._id === id);
    if (idx === -1) return null;
    const sets = update.$set || update;
    Object.assign(store[idx], sets, { updatedAt: new Date() });
    if (update.$inc) {
      Object.entries(update.$inc).forEach(([k, v]) => {
        store[idx][k] = (store[idx][k] || 0) + v;
      });
    }
    return { ...store[idx] };
  }

  async findByIdAndDelete(id) {
    const store = inMemoryStore.getCollection(this.col);
    const idx = store.findIndex(w => w._id === id);
    if (idx === -1) return null;
    return store.splice(idx, 1)[0];
  }

  async countDocuments(query = {}) {
    return (await this.find(query)).length;
  }
}

function getWorkflowModel() {
  if (inMemoryStore.enabled) return new InMemoryWorkflow();
  return mongoose.models.Workflow || mongoose.model('Workflow', workflowSchema);
}

module.exports = { workflowSchema, getWorkflowModel, InMemoryWorkflow };
