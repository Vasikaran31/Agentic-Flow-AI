const { getNotificationModel } = require('../models/Notification');

class NotificationService {
  async listNotifications(userId) {
    const Notification = getNotificationModel();
    return await Notification.find({ owner: userId });
  }

  async markAllAsRead(userId) {
    const Notification = getNotificationModel();
    await Notification.updateMany({ owner: userId, read: false }, { $set: { read: true } });
    return true;
  }
}

module.exports = new NotificationService();
