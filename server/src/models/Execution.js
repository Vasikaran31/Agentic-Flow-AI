const mongoose = require('mongoose');
const { inMemoryStore } = require('../config/db');

const executionSchema = new mongoose.Schema({
  workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  workflowSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: {
    type: String,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
    default: 'PENDING',
  },
  currentNode: { type: String, default: null },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  duration: { type: Number, default: 0 },
  input: { type: mongoose.Schema.Types.Mixed, default: {} },
  output: { type: mongoose.Schema.Types.Mixed, default: {} },
  error: { type: String, default: null },
  retryCount: { type: Number, default: 0 },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

class InMemoryExecution {
  constructor() { this.col = 'executions'; }

  async create(data) {
    const store = inMemoryStore.getCollection(this.col);
    const doc = {
      _id: new mongoose.Types.ObjectId().toString(),
      workflow: data.workflow,
      workflowSnapshot: data.workflowSnapshot || {},
      status: data.status || 'PENDING',
      currentNode: null,
      startedAt: null,
      completedAt: null,
      duration: 0,
      input: data.input || {},
      output: {},
      error: null,
      retryCount: 0,
      triggeredBy: data.triggeredBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.push(doc);
    return { ...doc };
  }

  async find(query = {}) {
    const store = inMemoryStore.getCollection(this.col);
    let results = [...store];
    if (query.workflow) results = results.filter(e => e.workflow === query.workflow);
    if (query.triggeredBy) results = results.filter(e => e.triggeredBy === query.triggeredBy);
    if (query.status) results = results.filter(e => e.status === query.status);
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findById(id) {
    const store = inMemoryStore.getCollection(this.col);
    return store.find(e => e._id === id) || null;
  }

  async findByIdAndUpdate(id, update) {
    const store = inMemoryStore.getCollection(this.col);
    const idx = store.findIndex(e => e._id === id);
    if (idx === -1) return null;
    const sets = update.$set || update;
    Object.assign(store[idx], sets, { updatedAt: new Date() });
    return { ...store[idx] };
  }

  async countDocuments(query = {}) {
    return (await this.find(query)).length;
  }
}

function getExecutionModel() {
  if (inMemoryStore.enabled) return new InMemoryExecution();
  return mongoose.models.Execution || mongoose.model('Execution', executionSchema);
}

module.exports = { executionSchema, getExecutionModel, InMemoryExecution };
