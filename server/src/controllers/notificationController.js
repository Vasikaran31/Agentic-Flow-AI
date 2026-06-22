const notificationService = require('../services/notificationService');

const notificationController = {
  listNotifications: async (req, res, next) => {
    try {
      const notifications = await notificationService.listNotifications(req.user.id);
      return res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error) {
      next(error);
    }
  },

  markAllAsRead: async (req, res, next) => {
    try {
      await notificationService.markAllAsRead(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = notificationController;
