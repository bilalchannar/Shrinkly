const User = require("../models/users");
const Link = require("../models/Link");
const QRCode = require("../models/QRCode");
const Analytics = require("../models/Analytics");
const ReportSettings = require("../models/ReportSettings");
const Conversion = require("../models/Conversion");
const ConversionPixel = require("../models/ConversionPixel");
const Contact = require("../models/Contact");
const TokenBlacklist = require("../models/TokenBlacklist");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// GET /api/users/profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Keep avatar and profileImage in sync
    const profileImg = user.profileImage || user.avatar || null;
    const planName = user.billingPlan || user.plan || "free";

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
        profileImage: profileImg,
        avatar: profileImg,
        timezone: user.timezone || "UTC",
        defaultDomain: user.defaultDomain || "shrinkly.link",
        defaultQrForegroundColor: user.defaultQrForegroundColor || "#6f42c1",
        defaultQrBackgroundColor: user.defaultQrBackgroundColor || "#ffffff",
        emailReportsEnabled: user.emailReportsEnabled ?? true,
        billingPlan: planName,
        plan: planName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/users/profile
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const {
      displayName,
      phone,
      company,
      bio,
      location,
      profileImage,
      avatar,
      timezone,
      defaultDomain,
      defaultQrForegroundColor,
      defaultQrBackgroundColor,
      emailReportsEnabled,
      billingPlan,
      plan
    } = req.body;

    // Update settings fields
    if (displayName !== undefined) user.displayName = displayName;
    if (phone !== undefined) user.phone = phone;
    if (company !== undefined) user.company = company;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;

    const img = profileImage !== undefined ? profileImage : avatar;
    if (img !== undefined) {
      user.profileImage = img;
      user.avatar = img;
    }

    if (timezone !== undefined) user.timezone = timezone;
    if (defaultDomain !== undefined) user.defaultDomain = defaultDomain;
    if (defaultQrForegroundColor !== undefined) user.defaultQrForegroundColor = defaultQrForegroundColor;
    if (defaultQrBackgroundColor !== undefined) user.defaultQrBackgroundColor = defaultQrBackgroundColor;
    if (emailReportsEnabled !== undefined) user.emailReportsEnabled = emailReportsEnabled;

    const selectedPlan = billingPlan !== undefined ? billingPlan : plan;
    if (selectedPlan !== undefined) {
      user.billingPlan = selectedPlan;
      user.plan = selectedPlan;
    }

    await user.save();

    const finalImg = user.profileImage || user.avatar || null;
    const finalPlan = user.billingPlan || user.plan || "free";

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
        profileImage: finalImg,
        avatar: finalImg,
        timezone: user.timezone || "UTC",
        defaultDomain: user.defaultDomain || "shrinkly.link",
        defaultQrForegroundColor: user.defaultQrForegroundColor || "#6f42c1",
        defaultQrBackgroundColor: user.defaultQrBackgroundColor || "#ffffff",
        emailReportsEnabled: user.emailReportsEnabled ?? true,
        billingPlan: finalPlan,
        plan: finalPlan,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/users/change-password
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
      return res.status(404).json({ success: false, message: "User not found" });
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
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/users/account
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
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Demo account protection
    if (user.email === "demo@shrinkly.com") {
      return res.status(403).json({
        success: false,
        message: "Destructive actions are prohibited on the demo account."
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

    // Cascade deletion
    const userLinks = await Link.find({ userId: req.userId }).select("_id");
    const linkIds = userLinks.map(l => l._id);

    await Analytics.deleteMany({ linkId: { $in: linkIds } });
    await Conversion.deleteMany({ linkId: { $in: linkIds } });
    await ConversionPixel.deleteMany({ linkId: { $in: linkIds } });
    await QRCode.deleteMany({ userId: req.userId });
    await ReportSettings.deleteMany({ userId: req.userId });
    await Contact.deleteMany({ email: user.email });
    await TokenBlacklist.deleteMany({ userId: req.userId });
    await Link.deleteMany({ userId: req.userId });
    await User.findByIdAndDelete(req.userId);

    return res.json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/users/export-data
exports.exportUserData = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.userId);

    // Fetch user and related resources
    const [user, links, qrCodes, reportSettings] = await Promise.all([
      User.findById(req.userId).select("-password"),
      Link.find({ userId: userObjectId }),
      QRCode.find({ userId: userObjectId }),
      ReportSettings.findOne({ userId: userObjectId })
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Create an analytics summary
    const linkIds = links.map(l => l._id);
    const [totalClicks, deviceStats, countryStats] = await Promise.all([
      Analytics.countDocuments({ linkId: { $in: linkIds } }),
      Analytics.aggregate([
        { $match: { linkId: { $in: linkIds } } },
        { $group: { _id: "$device", count: { $sum: 1 } } }
      ]),
      Analytics.aggregate([
        { $match: { linkId: { $in: linkIds } } },
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const analyticsSummary = {
      totalClicks,
      deviceBreakdown: deviceStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      topCountries: countryStats.map(c => ({ country: c._id, clicks: c.count }))
    };

    return res.json({
      success: true,
      exportData: {
        profile: {
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          bio: user.bio,
          phone: user.phone,
          company: user.company,
          location: user.location,
          profileImage: user.profileImage,
          timezone: user.timezone,
          defaultDomain: user.defaultDomain,
          emailReportsEnabled: user.emailReportsEnabled,
          billingPlan: user.billingPlan,
          createdAt: user.createdAt
        },
        links: links.map(l => ({
          originalUrl: l.originalUrl,
          shortCode: l.shortCode,
          domain: l.domain,
          title: l.title,
          clicks: l.clicks,
          status: l.status,
          createdAt: l.createdAt
        })),
        qrCodes: qrCodes.map(q => ({
          name: q.name || q.title,
          destinationUrl: q.destinationUrl,
          shortUrl: q.shortUrl,
          scanCount: q.scanCount || q.scans || 0,
          qrColor: q.qrColor,
          bgColor: q.bgColor,
          createdAt: q.createdAt
        })),
        analyticsSummary,
        reportSettings: reportSettings ? {
          enabled: reportSettings.enabled,
          frequency: reportSettings.frequency,
          dayOfWeek: reportSettings.dayOfWeek,
          dayOfMonth: reportSettings.dayOfMonth,
          time: reportSettings.time,
          recipientEmail: reportSettings.recipientEmail,
          lastSentAt: reportSettings.lastSentAt
        } : null
      }
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
