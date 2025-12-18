const User = require("../models/users");
const Link = require("../models/Link");
const QRCode = require("../models/QRCode");
const Analytics = require("../models/Analytics");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Convert userId to ObjectId for proper querying
    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    // Get user statistics
    const totalLinks = await Link.countDocuments({ userId: userObjectId });
    const totalClicks = await Link.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$clicks" } } }
    ]);
    const totalQRCodes = await QRCode.countDocuments({ userId: userObjectId });

    console.log("Profile stats for user:", req.userId, { totalLinks, totalClicks: totalClicks[0]?.total || 0, totalQRCodes });

    return res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName || user.username,
        bio: user.bio || "",
        phone: user.phone || "",
        company: user.company || "",
        location: user.location || "",
        avatar: user.avatar || null,
        plan: user.plan || "free",
        createdAt: user.createdAt
      },
      stats: {
        totalLinks,
        totalClicks: totalClicks[0]?.total || 0,
        totalQRCodes
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, displayName, bio, phone, company, location } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.userId } 
      });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "Username already taken" 
        });
      }
      user.username = username;
    }

    // Update fields if provided
    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (company !== undefined) user.company = company;
    if (location !== undefined) user.location = location;

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName || user.username,
        bio: user.bio || "",
        phone: user.phone || "",
        company: user.company || "",
        location: user.location || "",
        avatar: user.avatar || null
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Update email
exports.updateEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid password" 
      });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.userId } 
    });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already in use" 
      });
    }

    user.email = email;
    await user.save();

    return res.json({
      success: true,
      message: "Email updated successfully",
      email: user.email
    });
  } catch (error) {
    console.error("Error updating email:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Current password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "New password must be at least 6 characters" 
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Current password is incorrect" 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: "Password is required to delete account" 
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid password" 
      });
    }

    // Delete all user's data
    await Link.deleteMany({ userId: req.userId });
    await QRCode.deleteMany({ userId: req.userId });
    await Analytics.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);

    return res.json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Get user dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.userId;

    // Get total links
    const totalLinks = await Link.countDocuments({ userId });
    
    // Get active links
    const activeLinks = await Link.countDocuments({ userId, status: "active" });
    
    // Get total clicks
    const clicksResult = await Link.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$clicks" } } }
    ]);
    const totalClicks = clicksResult[0]?.total || 0;
    
    // Get total QR codes
    const totalQRCodes = await QRCode.countDocuments({ userId });
    
    // Get recent links (last 5)
    const recentLinks = await Link.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("originalUrl shortCode clicks createdAt");
    
    // Get top performing links
    const topLinks = await Link.find({ userId })
      .sort({ clicks: -1 })
      .limit(5)
      .select("originalUrl shortCode clicks");

    return res.json({
      success: true,
      stats: {
        totalLinks,
        activeLinks,
        totalClicks,
        totalQRCodes
      },
      recentLinks: recentLinks.map(l => ({
        _id: l._id,
        originalUrl: l.originalUrl,
        shortCode: l.shortCode,
        clicks: l.clicks,
        createdAt: l.createdAt
      })),
      topLinks: topLinks.map(l => ({
        _id: l._id,
        originalUrl: l.originalUrl,
        shortCode: l.shortCode,
        clicks: l.clicks
      }))
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};
