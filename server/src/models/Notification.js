const mongoose = require('mongoose');
const { inMemoryStore } = require('../config/db');

const notificationSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
  execution: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution' },
  type: {
    type: String,
    enum: ['success', 'failure', 'escalation', 'info'],
    default: 'info',
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

class InMemoryNotification {
  constructor() { this.col = 'notifications'; }

  async create(data) {
    const store = inMemoryStore.getCollection(this.col);
    const doc = {
      _id: new mongoose.Types.ObjectId().toString(),
      owner: data.owner,
      workflow: data.workflow || null,
      execution: data.execution || null,
      type: data.type || 'info',
      title: data.title,
      message: data.message,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.push(doc);
    return { ...doc };
  }

  async find(query = {}) {
    const store = inMemoryStore.getCollection(this.col);
    let results = [...store];
    if (query.owner) results = results.filter(n => n.owner === query.owner);
    if (query.read !== undefined) results = results.filter(n => n.read === query.read);
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findByIdAndUpdate(id, update) {
    const store = inMemoryStore.getCollection(this.col);
    const idx = store.findIndex(n => n._id === id);
    if (idx === -1) return null;
    const sets = update.$set || update;
    Object.assign(store[idx], sets, { updatedAt: new Date() });
    return { ...store[idx] };
  }

  async updateMany(query, update) {
    const store = inMemoryStore.getCollection(this.col);
    let count = 0;
    store.forEach(n => {
      let matches = true;
      if (query.owner && n.owner !== query.owner) matches = false;
      if (query.read !== undefined && n.read !== query.read) matches = false;

      if (matches) {
        const sets = update.$set || update;
        Object.assign(n, sets, { updatedAt: new Date() });
        count++;
      }
    });
    return { modifiedCount: count };
  }
}

function getNotificationModel() {
  if (inMemoryStore.enabled) return new InMemoryNotification();
  return mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
}

module.exports = { notificationSchema, getNotificationModel, InMemoryNotification };
