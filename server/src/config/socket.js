const { Server } = require('socket.io');
const env = require('./env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join execution room for live timeline updates
    socket.on('join:execution', (executionId) => {
      socket.join(`execution:${executionId}`);
      console.log(`📡 Socket ${socket.id} joined execution:${executionId}`);
    });

    socket.on('leave:execution', (executionId) => {
      socket.leave(`execution:${executionId}`);
    });

    // Join user room for notifications
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`📡 Socket ${socket.id} joined user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    console.warn('⚠️  Socket.IO not initialized yet');
    // Return a no-op emitter so callers don't crash
    return {
      to: () => ({ emit: () => {} }),
      emit: () => {},
    };
  }
  return io;
}

module.exports = { initSocket, getIO };
