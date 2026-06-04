const crypto = require("crypto");
const ApiKey = require("../models/ApiKey");
const User = require("../models/users");

const apiKeyAuth = async (req, res, next) => {
  try {
    let keyStr = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      keyStr = authHeader.split(" ")[1];
    }

    // Check x-api-key header if authorization is not present or invalid
    if (!keyStr && req.headers["x-api-key"]) {
      keyStr = req.headers["x-api-key"];
    }

    if (!keyStr) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed. Provide a valid API key in Authorization header or x-api-key header."
      });
    }

    // Hash the incoming key to find it in the DB
    const hashedKey = crypto.createHash("sha256").update(keyStr.trim()).digest("hex");

    const apiKeyRecord = await ApiKey.findOne({ keyHash: hashedKey, status: "active" });
    if (!apiKeyRecord) {
      return res.status(401).json({
        success: false,
        message: "Invalid or revoked API key."
      });
    }

    // Retrieve user and check plan
    const user = await User.findById(apiKeyRecord.userId);
    if (!user || user.suspended) {
      return res.status(403).json({
        success: false,
        message: "User account suspended or not found."
      });
    }

    // Pro/Enterprise check
    if (user.billingPlan !== "pro" && user.billingPlan !== "enterprise") {
      return res.status(403).json({
        success: false,
        message: "Developer API access requires a Pro or Enterprise billing plan."
      });
    }

    // Set user info on req for downstream controllers
    req.userId = user._id;
    req.userRole = user.role;
    req.apiKeyId = apiKeyRecord._id;

    // Asynchronously update usage statistics
    ApiKey.findByIdAndUpdate(apiKeyRecord._id, {
      $inc: { usageCount: 1 },
      $set: { lastUsedAt: new Date() }
    }).catch(err => console.error("Error updating API key usage metrics:", err));

    next();
  } catch (error) {
    console.error("API key auth middleware error:", error);
    return res.status(500).json({ success: false, message: "Server error during authentication" });
  }
};

module.exports = { apiKeyAuth };
