const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Apply auth to all notification routes
router.use(authMiddleware);

// GET notifications list
router.get('/', notificationController.listNotifications);

// PUT mark all as read
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
