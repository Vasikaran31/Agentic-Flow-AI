const mongoose = require('mongoose');
const { inMemoryStore } = require('../config/db');

const executionLogSchema = new mongoose.Schema({
  execution: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution', required: true },
  workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
  nodeId: { type: String, default: null },
  agent: {
    type: String,
    enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring', 'orchestrator'],
    required: true,
  },
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info',
  },
  eventType: { type: String, default: 'agent_step' },
  message: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

class InMemoryExecutionLog {
  constructor() { this.col = 'executionLogs'; }

  async create(data) {
    const store = inMemoryStore.getCollection(this.col);
    const doc = {
      _id: new mongoose.Types.ObjectId().toString(),
      execution: data.execution,
      workflow: data.workflow || null,
      nodeId: data.nodeId || null,
      agent: data.agent,
      level: data.level || 'info',
      eventType: data.eventType || 'agent_step',
      message: data.message,
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
    if (query.execution) results = results.filter(l => l.execution === query.execution);
    if (query.workflow) results = results.filter(l => l.workflow === query.workflow);
    if (query.agent) results = results.filter(l => l.agent === query.agent);
    return results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  async countDocuments(query = {}) {
    return (await this.find(query)).length;
  }
}

function getExecutionLogModel() {
  if (inMemoryStore.enabled) return new InMemoryExecutionLog();
  return mongoose.models.ExecutionLog || mongoose.model('ExecutionLog', executionLogSchema);
}

module.exports = { executionLogSchema, getExecutionLogModel, InMemoryExecutionLog };
