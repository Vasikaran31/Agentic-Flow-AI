const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { inMemoryStore } = require('../config/db');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false, // Never returned by default
  },
  role: {
    type: String,
    enum: ['admin', 'operator'],
    default: 'operator',
  },
  lastLogin: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── In-Memory Fallback Model ──────────────────────────────────────────
class InMemoryUser {
  constructor() {
    this.collection = 'users';
  }

  async create(data) {
    const store = inMemoryStore.getCollection(this.collection);
    const existing = store.find(u => u.email === data.email);
    if (existing) {
      const err = new Error('Duplicate email');
      err.code = 11000;
      throw err;
    }
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role || 'operator',
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.push(user);
    // Return without password
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async findOne(query) {
    const store = inMemoryStore.getCollection(this.collection);
    let user = null;
    if (query._id) {
      user = store.find(u => u._id === query._id);
    } else if (query.email) {
      user = store.find(u => u.email === query.email.toLowerCase());
    }
    return user ? { ...user } : null;
  }

  async findById(id) {
    const store = inMemoryStore.getCollection(this.collection);
    const user = store.find(u => u._id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async findByIdAndUpdate(id, update) {
    const store = inMemoryStore.getCollection(this.collection);
    const idx = store.findIndex(u => u._id === id);
    if (idx === -1) return null;
    if (update.$set) {
      Object.assign(store[idx], update.$set);
    } else {
      Object.assign(store[idx], update);
    }
    store[idx].updatedAt = new Date();
    const { password, ...safeUser } = store[idx];
    return safeUser;
  }

  // Helper to get user WITH password for auth
  async findByEmailWithPassword(email) {
    const store = inMemoryStore.getCollection(this.collection);
    return store.find(u => u.email === email.toLowerCase()) || null;
  }
}

function getUserModel() {
  if (inMemoryStore.enabled) {
    return new InMemoryUser();
  }
  return mongoose.models.User || mongoose.model('User', userSchema);
}

module.exports = { userSchema, getUserModel, InMemoryUser };
