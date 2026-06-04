const Notification = require("../models/Notification");

/**
 * Create a new notification for a user.
 * @param {string} userId - ID of the target user
 * @param {string} type - info, success, warning, danger
 * @param {string} title - Notification title
 * @param {string} message - Notification content body
 * @param {object} metadata - Extra details (e.g., links or action ids)
 */
const createNotification = async (userId, type, title, message, metadata = {}) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      metadata
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification in service:", error);
    // Return null instead of crashing, ensuring core actions don't fail due to notifications
    return null;
  }
};

module.exports = {
  createNotification
};
