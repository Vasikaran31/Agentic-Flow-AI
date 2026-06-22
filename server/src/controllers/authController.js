const jwt = require('jsonwebtoken');
const { getUserModel } = require('../models/User');
const env = require('../config/env');

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

const authController = {
  register: async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const User = getUserModel();

      // Check if user already exists
      let existingUser;
      if (typeof User.findOne === 'function') {
        existingUser = await User.findOne({ email });
      }

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists',
        });
      }

      // Create new user
      const user = await User.create({
        name,
        email,
        password,
        role: role || 'operator',
      });

      const token = generateToken(user);

      // Return user without password
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists',
        });
      }
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const User = getUserModel();

      let user;
      // In-memory or mongoose queries
      if (typeof User.findByEmailWithPassword === 'function') {
        user = await User.findByEmailWithPassword(email);
      } else {
        user = await User.findOne({ email }).select('+password');
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Check password
      let isMatch = false;
      if (typeof user.comparePassword === 'function') {
        isMatch = await user.comparePassword(password);
      } else {
        const bcrypt = require('bcryptjs');
        isMatch = await bcrypt.compare(password, user.password);
      }

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Update last login
      if (typeof User.findByIdAndUpdate === 'function') {
        await User.findByIdAndUpdate(user._id, { $set: { lastLogin: new Date() } });
      }

      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  me: async (req, res, next) => {
    try {
      const User = getUserModel();
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
