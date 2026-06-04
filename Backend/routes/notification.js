const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { auth } = require("../middleware/authMiddleware");

// 1. Get all notifications for current user
router.get("/", auth, async (req, res, next) => {
  try {
    const { isRead } = req.query;
    const filter = { userId: req.userId };
    
    if (isRead !== undefined) {
      filter.isRead = isRead === "true";
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
});

// 2. Get unread count
router.get("/unread-count", auth, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ userId: req.userId, isRead: false });
    return res.status(200).json({ success: true, count });
  } catch (error) {
    next(error);
  }
});

// 3. Mark a single notification as read
router.patch("/:id/read", auth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
});

// 4. Mark all as read
router.patch("/read-all", auth, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    next(error);
  }
});

// 5. Delete a notification
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    return res.status(200).json({ success: true, message: "Notification deleted." });
  } catch (error) {
    next(error);
  }
});

// 6. Clear all read notifications
router.delete("/clear-read", auth, async (req, res, next) => {
  try {
    await Notification.deleteMany({ userId: req.userId, isRead: true });
    return res.status(200).json({ success: true, message: "Read notifications cleared." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
