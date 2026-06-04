const ApiKey = require("../models/ApiKey");
const User = require("../models/users");
const crypto = require("crypto");

// Create a new API Key for authenticated user
exports.createApiKey = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "API key name is required" });
    }

    // Verify user plan (requires Pro or Enterprise)
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentPlan = user.plan || user.billingPlan || "free";
    if (currentPlan !== "pro" && currentPlan !== "enterprise") {
      return res.status(403).json({
        success: false,
        message: "Developer API keys are only available to Pro or Enterprise users."
      });
    }

    // Generate unique API key
    // Prefix with sk_live_ to indicate live secret key
    const rawKey = "sk_live_" + crypto.randomBytes(24).toString("hex");
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPreview = "sk_live_****" + rawKey.slice(-4);

    const apiKey = new ApiKey({
      userId: req.userId,
      name: name.trim(),
      keyHash,
      keyPreview,
      status: "active"
    });

    await apiKey.save();

    return res.status(201).json({
      success: true,
      message: "API Key generated successfully. Save it now as you won't be able to see it again.",
      apiKey: {
        _id: apiKey._id,
        name: apiKey.name,
        keyPreview: apiKey.keyPreview,
        status: apiKey.status,
        usageCount: apiKey.usageCount,
        lastUsedAt: apiKey.lastUsedAt,
        createdAt: apiKey.createdAt
      },
      rawKey // Show once to the client
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all API keys for authenticated user
exports.getApiKeys = async (req, res) => {
  try {
    const apiKeys = await ApiKey.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      apiKeys
    });
  } catch (error) {
    console.error("Error getting API keys:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Revoke an API key
exports.revokeApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { status: "revoked" } },
      { new: true }
    );

    if (!apiKey) {
      return res.status(404).json({ success: false, message: "API key not found" });
    }

    return res.json({
      success: true,
      message: "API Key revoked successfully.",
      apiKey
    });
  } catch (error) {
    console.error("Error revoking API key:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete an API key (hard delete)
exports.deleteApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await ApiKey.findOneAndDelete({ _id: id, userId: req.userId });

    if (!result) {
      return res.status(404).json({ success: false, message: "API key not found" });
    }

    return res.json({
      success: true,
      message: "API Key deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
