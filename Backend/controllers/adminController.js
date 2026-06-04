const User = require("../models/users");
const Link = require("../models/Link");
const Analytics = require("../models/Analytics");
const Contact = require("../models/Contact");
const ReportLog = require("../models/ReportLog");
const mongoose = require("mongoose");

// Helper: format user for admin view (no password)
const formatUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  plan: user.plan || user.billingPlan || "free",
  emailVerified: user.emailVerified,
  suspended: user.suspended || false,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

// ======================== GET ADMIN DASHBOARD ========================
exports.getAdminDashboard = async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalLinks,
      activeLinks,
      suspendedUsers,
      pendingTickets,
      reportsSent,
      disabledLinks,
      newUsersThisWeek,
      clicksThisWeek
    ] = await Promise.all([
      User.countDocuments(),
      Link.countDocuments(),
      Link.countDocuments({ status: "active" }),
      User.countDocuments({ suspended: true }),
      Contact.countDocuments({ status: "new" }),
      ReportLog.countDocuments({ status: "sent" }),
      Link.countDocuments({ status: "inactive" }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      Analytics.countDocuments({ clickedAt: { $gte: weekAgo } })
    ]);

    // Total Clicks across all links
    const totalClicksResult = await Link.aggregate([
      { $group: { _id: null, total: { $sum: "$clicks" } } }
    ]);
    const totalClicks = totalClicksResult[0]?.total || 0;

    // Recent user signups (last 5)
    const recentUsers = await User.find()
      .select("username email displayName plan role createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent links (last 5)
    const recentLinks = await Link.find()
      .populate("userId", "email username")
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent tickets (last 5)
    const recentTickets = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent reports sent (last 5)
    const recentReports = await ReportLog.find()
      .sort({ sentAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalLinks,
        totalClicks,
        activeLinks,
        suspendedUsers,
        pendingTickets,
        reportsSent,
        disabledLinks,
        newUsersThisWeek,
        clicksThisWeek
      },
      recentUsers: recentUsers.map(formatUser),
      recentLinks,
      recentTickets,
      recentReports
    });
  } catch (error) {
    console.error("Get admin dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET ALL USERS ========================
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(filter)
      .select("-password -verificationToken -resetPasswordToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users: users.map(formatUser),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET USER DETAILS ========================
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password -verificationToken -resetPasswordToken");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get user's links stats
    const linksCount = await Link.countDocuments({ userId });
    const linksStats = await Link.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: "$clicks" },
          activeLinks: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      user: formatUser(user),
      links: {
        total: linksCount,
        totalClicks: linksStats[0]?.totalClicks || 0,
        active: linksStats[0]?.activeLinks || 0
      }
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== UPDATE USER ROLE ========================
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin", "superadmin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password -verificationToken -resetPasswordToken");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: formatUser(user)
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== SUSPEND USER ========================
exports.suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Mark all user's links as inactive
    await Link.updateMany(
      { userId },
      { status: "inactive" }
    );

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.suspended = true;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.username} and all their links have been suspended`,
      reason: reason || "No reason provided",
      user: formatUser(user)
    });
  } catch (error) {
    console.error("Suspend user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== ACTIVATE USER ========================
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Mark all user's links as active
    await Link.updateMany(
      { userId },
      { status: "active" }
    );

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.suspended = false;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.username} and all their links have been reactivated`,
      user: formatUser(user)
    });
  } catch (error) {
    console.error("Activate user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET PLATFORM ANALYTICS ========================
exports.getPlatformAnalytics = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    });

    // Total links
    const totalLinks = await Link.countDocuments();
    const activeLinks = await Link.countDocuments({ status: "active" });

    // Total clicks
    const clickStats = await Link.aggregate([
      {
        $group: {
          _id: null,
          totalClicks: { $sum: "$clicks" }
        }
      }
    ]);

    // User distribution by role
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Plan distribution
    const planDistribution = await User.aggregate([
      {
        $group: {
          _id: "$plan",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      analytics: {
        users: {
          total: totalUsers,
          active: activeUsers
        },
        links: {
          total: totalLinks,
          active: activeLinks
        },
        clicks: {
          total: clickStats[0]?.totalClicks || 0
        },
        distribution: {
          byRole: roleDistribution,
          byPlan: planDistribution
        }
      }
    });
  } catch (error) {
    console.error("Get platform analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== DELETE USER ========================
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting superadmin
    const user = await User.findById(userId);
    if (user && user.role === "superadmin") {
      return res.status(403).json({ 
        success: false, 
        message: "Cannot delete superadmin users" 
      });
    }

    // Delete user's links
    await Link.deleteMany({ userId });

    // Delete user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: `User ${deletedUser.username} and all their data have been deleted`
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET ALL LINKS (ADMIN VIEW) ========================
exports.getAllLinks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId, search } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (search) {
      filter.$or = [
        { originalUrl: { $regex: search, $options: "i" } },
        { shortCode: { $regex: search, $options: "i" } }
      ];
    }

    const links = await Link.find(filter)
      .populate("userId", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Link.countDocuments(filter);

    res.json({
      success: true,
      links,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Get all links error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== DISABLE LINK ========================
exports.disableLink = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findByIdAndUpdate(id, { status: "inactive" }, { new: true }).populate("userId", "username email");
    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }
    res.json({ success: true, message: "Link disabled successfully", link });
  } catch (error) {
    console.error("Disable link error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== ENABLE LINK ========================
exports.enableLink = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await Link.findByIdAndUpdate(id, { status: "active" }, { new: true }).populate("userId", "username email");
    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }
    res.json({ success: true, message: "Link enabled successfully", link });
  } catch (error) {
    console.error("Enable link error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET TICKETS ========================
exports.getTickets = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const tickets = await Contact.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    console.error("Get support tickets error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== UPDATE TICKET STATUS ========================
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;
    if (status === "replied") updateFields.repliedAt = new Date();

    const ticket = await Contact.findByIdAndUpdate(id, updateFields, { new: true });
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // If marked as replied, notify user if they exist in system
    if (status === "replied") {
      try {
        const User = require("../models/users");
        const userObj = await User.findOne({ email: ticket.email });
        if (userObj) {
          const { createNotification } = require("../services/notificationService");
          await createNotification(
            userObj._id,
            "success",
            "Support Ticket Replied",
            `Your support request regarding "${ticket.subject}" has received a reply.`,
            { contactId: ticket._id }
          );
        }
      } catch (err) {
        console.error("Failed to create support reply notification in admin:", err);
      }
    }

    res.json({ success: true, message: "Ticket status updated", ticket });
  } catch (error) {
    console.error("Update ticket status error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET REPORT LOGS ========================
exports.getReportLogs = async (req, res) => {
  try {
    const logs = await ReportLog.find()
      .populate("userId", "username email")
      .sort({ sentAt: -1 })
      .limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    console.error("Get report logs error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET ABUSE REPORTS ========================
exports.getAbuseReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const AbuseReport = require("../models/AbuseReport");
    const reports = await AbuseReport.find(filter)
      .populate("linkId")
      .sort({ createdAt: -1 });

    res.json({ success: true, reports });
  } catch (error) {
    console.error("Get abuse reports error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== UPDATE ABUSE REPORT STATUS ========================
exports.updateAbuseReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const AbuseReport = require("../models/AbuseReport");
    const report = await AbuseReport.findByIdAndUpdate(id, { status }, { new: true });
    if (!report) {
      return res.status(404).json({ success: false, message: "Abuse report not found" });
    }

    res.json({ success: true, message: "Abuse report status updated successfully", report });
  } catch (error) {
    console.error("Update abuse report status error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== UPDATE LINK SAFETY STATUS ========================
exports.updateLinkSafety = async (req, res) => {
  try {
    const { id } = req.params;
    const { safetyStatus, safetyReason } = req.body;

    if (!["safe", "suspicious", "blocked"].includes(safetyStatus)) {
      return res.status(400).json({ success: false, message: "Invalid safety status" });
    }

    const updateFields = {
      safetyStatus,
      safetyReason: safetyReason || ""
    };

    if (safetyStatus === "blocked") {
      updateFields.status = "inactive";
      updateFields.disabledByAdmin = true;
      updateFields.disabledAt = new Date();
    } else {
      updateFields.status = "active";
      updateFields.disabledByAdmin = false;
      updateFields.disabledAt = null;
    }

    const link = await Link.findByIdAndUpdate(id, { $set: updateFields }, { new: true }).populate("userId", "username email");
    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    res.json({ success: true, message: `Link safety status updated to ${safetyStatus}`, link });
  } catch (error) {
    console.error("Update link safety status error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

