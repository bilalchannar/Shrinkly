const express = require("express");
const router = express.Router();
const Link = require("../models/Link");
const Analytics = require("../models/Analytics");
const { auth } = require("../middleware/authMiddleware");

// ======================== SLUG SUGGESTIONS ========================
router.post("/slug-suggestions", auth, async (req, res, next) => {
  try {
    const { title, originalUrl } = req.body;
    const suggestions = [];

    // Extract domain name from URL
    let domainWord = "";
    try {
      const parsed = new URL(originalUrl || "");
      domainWord = parsed.hostname.replace("www.", "").split(".")[0];
    } catch {}

    // Extract title words
    const titleWords = (title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 3);

    // Generate candidate slugs
    const candidates = [];

    if (domainWord) {
      candidates.push(domainWord);
      candidates.push(`${domainWord}-link`);
    }

    if (titleWords.length > 0) {
      candidates.push(titleWords.join("-"));
      candidates.push(titleWords.slice(0, 2).join("-"));
    }

    if (domainWord && titleWords.length > 0) {
      candidates.push(`${domainWord}-${titleWords[0]}`);
    }

    // Add random suffix variants
    const rand = () => Math.floor(Math.random() * 999) + 1;
    if (domainWord) candidates.push(`${domainWord}-${rand()}`);
    if (titleWords.length > 0) candidates.push(`${titleWords[0]}-${rand()}`);

    // Clean up and deduplicate
    const cleaned = [...new Set(
      candidates
        .map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30))
        .filter(s => s.length >= 3)
    )];

    // Check uniqueness in database
    for (const slug of cleaned) {
      if (suggestions.length >= 5) break;
      const exists = await Link.findOne({ shortCode: slug });
      if (!exists) {
        suggestions.push(slug);
      } else {
        // Try with a number suffix
        const withNum = `${slug}-${rand()}`;
        const exists2 = await Link.findOne({ shortCode: withNum });
        if (!exists2) suggestions.push(withNum);
      }
    }

    // Fallback if not enough suggestions
    while (suggestions.length < 3) {
      const fallback = `link-${Date.now().toString(36).slice(-4)}-${rand()}`;
      suggestions.push(fallback);
    }

    return res.status(200).json({ success: true, suggestions: suggestions.slice(0, 5) });
  } catch (error) {
    next(error);
  }
});

// ======================== TAG SUGGESTIONS ========================
router.post("/tag-suggestions", auth, async (req, res, next) => {
  try {
    const { originalUrl } = req.body;
    const tags = [];

    if (!originalUrl) {
      return res.status(200).json({ success: true, tags: [] });
    }

    const urlLower = originalUrl.toLowerCase();
    let hostname = "";
    try {
      hostname = new URL(originalUrl).hostname.toLowerCase();
    } catch {}

    // Domain-based rules
    const rules = [
      { domains: ["youtube.com", "youtu.be", "vimeo.com"], tag: "video" },
      { domains: ["github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com"], tag: "developer" },
      { domains: ["linkedin.com"], tag: "professional" },
      { domains: ["facebook.com", "twitter.com", "x.com", "instagram.com", "tiktok.com", "reddit.com"], tag: "social" },
      { domains: ["docs.google.com", "notion.so", "confluence.atlassian.com"], tag: "education" },
      { domains: ["medium.com", "dev.to", "hashnode.dev"], tag: "content" },
    ];

    for (const rule of rules) {
      if (rule.domains.some(d => hostname.includes(d))) {
        tags.push(rule.tag);
      }
    }

    // Keyword-based rules
    const keywordRules = [
      { keywords: ["shop", "store", "cart", "product", "checkout", "buy", "price"], tag: "ecommerce" },
      { keywords: ["blog", "article", "news", "post", "story"], tag: "content" },
      { keywords: ["docs", "documentation", "guide", "tutorial", "wiki", "help"], tag: "education" },
      { keywords: ["portfolio", "resume", "cv", "about-me"], tag: "personal-brand" },
      { keywords: ["campaign", "sale", "offer", "discount", "promo", "deal"], tag: "marketing" },
    ];

    for (const rule of keywordRules) {
      if (rule.keywords.some(k => urlLower.includes(k)) && !tags.includes(rule.tag)) {
        tags.push(rule.tag);
      }
    }

    return res.status(200).json({ success: true, tags });
  } catch (error) {
    next(error);
  }
});

// ======================== BEST TIME RECOMMENDATION ========================
router.get("/best-time", auth, async (req, res, next) => {
  try {
    const links = await Link.find({ userId: req.userId }).select("_id");
    const linkIds = links.map(l => l._id);

    const clicks = await Analytics.find({ linkId: { $in: linkIds } }).select("clickedAt");

    if (clicks.length < 5) {
      return res.status(200).json({
        success: true,
        bestDay: null,
        bestHour: null,
        totalClicksUsed: clicks.length,
        explanation: "Not enough click data to generate recommendations. Share your links to start gathering analytics."
      });
    }

    // Count clicks per day of week and per hour
    const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    const hourCount = new Array(24).fill(0);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (const click of clicks) {
      const d = new Date(click.clickedAt);
      dayCount[d.getDay()]++;
      hourCount[d.getHours()]++;
    }

    const bestDayIdx = dayCount.indexOf(Math.max(...dayCount));
    const bestHourIdx = hourCount.indexOf(Math.max(...hourCount));

    const formatHour = (h) => {
      const period = h >= 12 ? "PM" : "AM";
      const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${display}:00 ${period}`;
    };

    return res.status(200).json({
      success: true,
      bestDay: dayNames[bestDayIdx],
      bestHour: formatHour(bestHourIdx),
      totalClicksUsed: clicks.length,
      explanation: `Based on ${clicks.length} clicks, your links perform best on ${dayNames[bestDayIdx]}s around ${formatHour(bestHourIdx)}. Schedule important links during this window for maximum engagement.`
    });
  } catch (error) {
    next(error);
  }
});

// ======================== ANOMALY DETECTION ========================
router.get("/anomalies", auth, async (req, res, next) => {
  try {
    const links = await Link.find({ userId: req.userId }).select("_id shortCode customSlug");
    const anomalies = [];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    for (const link of links) {
      // Count today's clicks
      const todayClicks = await Analytics.countDocuments({
        linkId: link._id,
        clickedAt: { $gte: todayStart, $lte: todayEnd }
      });

      if (todayClicks < 5) continue; // Skip low traffic links

      // Calculate average daily clicks from previous 7 days
      const weekAgo = new Date(todayStart);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const pastClicks = await Analytics.countDocuments({
        linkId: link._id,
        clickedAt: { $gte: weekAgo, $lt: todayStart }
      });

      const avgDailyClicks = pastClicks / 7;

      // Detect anomaly: today's clicks > 2x average and meaningful
      if (avgDailyClicks > 0 && todayClicks > avgDailyClicks * 2) {
        const percentageIncrease = Math.round(((todayClicks - avgDailyClicks) / avgDailyClicks) * 100);

        anomalies.push({
          linkId: link._id,
          slug: link.shortCode,
          title: link.customSlug || link.shortCode,
          todayClicks,
          averageClicks: Math.round(avgDailyClicks),
          percentageIncrease,
          message: `This link received ${percentageIncrease}% more clicks than usual today.`
        });
      }
    }

    return res.status(200).json({ success: true, anomalies });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
