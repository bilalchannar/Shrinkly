const AbuseReport = require("../models/AbuseReport");
const Link = require("../models/Link");

exports.submitReport = async (req, res) => {
  try {
    const { shortUrl, reason, details, reporterEmail } = req.body;

    if (!shortUrl || !reason || !details) {
      return res.status(400).json({ success: false, message: "Missing required fields: shortUrl, reason, and details are required." });
    }

    if (!["phishing", "malware", "spam", "inappropriate", "other"].includes(reason)) {
      return res.status(400).json({ success: false, message: "Invalid reason type." });
    }

    // Extract short slug
    let slug = shortUrl.trim();
    try {
      if (slug.startsWith("http://") || slug.startsWith("https://")) {
        const parsed = new URL(slug);
        const pathParts = parsed.pathname.split("/").filter(Boolean);
        // Extracts the final slug fragment (supporting /slug or /r/slug formats)
        slug = pathParts[pathParts.length - 1] || slug;
      }
    } catch (e) {
      // Fallback to original string if not a valid URL
    }

    // Search link
    const link = await Link.findOne({ shortCode: slug });

    const newReport = new AbuseReport({
      linkId: link ? link._id : null,
      shortUrl: shortUrl.trim(),
      reportedUrl: link ? link.originalUrl : "",
      reason,
      details: details.trim(),
      reporterEmail: reporterEmail ? reporterEmail.trim() : "",
      status: "pending"
    });

    await newReport.save();

    return res.status(201).json({
      success: true,
      message: "Abuse report submitted successfully. Our safety team will review this shortly."
    });
  } catch (error) {
    console.error("Error submitting abuse report:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
