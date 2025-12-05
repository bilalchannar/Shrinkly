const Link = require("../models/Link");
const QRCode = require("../models/QRCode");
const Analytics = require("../models/Analytics");
const mongoose = require("mongoose");

// Get home/dashboard statistics (public overview)
exports.getPublicStats = async (req, res) => {
  try {
    // Get public counts (no user filtering)
    const totalLinks = await Link.countDocuments();
    const totalClicks = await Link.aggregate([
      { $group: { _id: null, total: { $sum: "$clicks" } } }
    ]);

    return res.json({
      success: true,
      stats: {
        totalLinksCreated: totalLinks,
        totalClicks: totalClicks[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("Error fetching public stats:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Get user dashboard statistics
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    // Get user-specific counts
    const totalLinks = await Link.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    const activeLinks = await Link.countDocuments({ 
      userId: new mongoose.Types.ObjectId(userId), 
      status: "active" 
    });

    const clicksResult = await Link.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$clicks" } } }
    ]);
    const totalClicks = clicksResult[0]?.total || 0;

    const totalQRCodes = await QRCode.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });

    // Get recent links (last 5)
    const recentLinks = await Link.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("originalUrl shortCode domain clicks createdAt status");

    // Get top performing links (by clicks)
    const topLinks = await Link.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ clicks: -1 })
      .limit(5)
      .select("originalUrl shortCode domain clicks");

    // Get click trends for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const userLinkIds = await Link.find({ userId: new mongoose.Types.ObjectId(userId) }).distinct("_id");

    const clickTrends = await Analytics.aggregate([
      { 
        $match: { 
          linkId: { $in: userLinkIds },
          clickedAt: { $gte: sevenDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$clickedAt" } },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get device breakdown
    const deviceBreakdown = await Analytics.aggregate([
      { $match: { linkId: { $in: userLinkIds } } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get referrer breakdown
    const referrerBreakdown = await Analytics.aggregate([
      { $match: { linkId: { $in: userLinkIds } } },
      { $group: { _id: "$referrerDomain", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

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
        shortUrl: `${l.domain}/${l.shortCode}`,
        shortCode: l.shortCode,
        clicks: l.clicks,
        status: l.status,
        createdAt: l.createdAt
      })),
      topLinks: topLinks.map(l => ({
        _id: l._id,
        originalUrl: l.originalUrl,
        shortUrl: `${l.domain}/${l.shortCode}`,
        clicks: l.clicks
      })),
      clickTrends: clickTrends.map(t => ({ date: t._id, clicks: t.clicks })),
      deviceBreakdown: deviceBreakdown.map(d => ({ device: d._id, count: d.count })),
      referrerBreakdown: referrerBreakdown.map(r => ({ source: r._id, count: r.count }))
    });
  } catch (error) {
    console.error("Error fetching user dashboard:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};
