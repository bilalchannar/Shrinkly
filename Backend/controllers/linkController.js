const Link = require("../models/Link");
const crypto = require("crypto");

exports.createShortLink = async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ message: "URL required" });
    }

    const shortCode = crypto.randomBytes(3).toString("hex");

    const newLink = new Link({ originalUrl, shortCode });
    await newLink.save();

    return res.json({
      shortUrl: `http://localhost:5000/r/${shortCode}`
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.redirectToOriginal = async (req, res) => {
  try {
    const code = req.params.code;

    const link = await Link.findOne({ shortCode: code });
    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    return res.redirect(link.originalUrl);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
