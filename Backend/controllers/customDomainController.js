const CustomDomain = require("../models/CustomDomain");
const Link = require("../models/Link");
const crypto = require("crypto");
const { getWorkspaceMember } = require("../middleware/workspaceAuth");

// Helper: validate domain format (simple regex)
const isValidDomainName = (domainName) => {
  const reg = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return reg.test(domainName);
};

// ======================== ADD CUSTOM DOMAIN ========================
exports.addDomain = async (req, res) => {
  try {
    const { domain, workspaceId } = req.body;

    if (!domain || !domain.trim()) {
      return res.status(400).json({ success: false, message: "Domain name is required" });
    }

    const cleanDomain = domain.trim().toLowerCase();

    if (!isValidDomainName(cleanDomain)) {
      return res.status(400).json({ success: false, message: "Invalid domain format. Use e.g. links.mybrand.com" });
    }

    // Check if domain already exists in system
    const existing = await CustomDomain.findOne({ domain: cleanDomain });
    if (existing) {
      return res.status(400).json({ success: false, message: "Domain is already registered in the system" });
    }

    // Workspace check
    let targetWorkspaceId = null;
    if (workspaceId && workspaceId !== "personal") {
      const memberInfo = await getWorkspaceMember(workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
      if (memberInfo.role !== "owner" && memberInfo.role !== "admin") {
        return res.status(403).json({ success: false, message: "Access denied. Only Owner or Admin can manage custom domains." });
      }
      targetWorkspaceId = workspaceId;
    }

    // Generate unique verification token
    const verificationToken = `shrinkly-verify-${crypto.randomBytes(8).toString("hex")}`;

    const newDomain = new CustomDomain({
      userId: req.userId,
      workspaceId: targetWorkspaceId,
      domain: cleanDomain,
      status: "pending",
      verificationToken,
      isDefault: false
    });

    await newDomain.save();

    return res.status(201).json({
      success: true,
      message: "Domain added successfully. Please configure DNS records.",
      domain: newDomain,
      dnsInstructions: {
        type: "CNAME",
        host: "@ or subdomain (e.g. links)",
        value: "shrinkly.app",
        text: "Add CNAME record pointing your domain to shrinkly.app"
      }
    });
  } catch (error) {
    console.error("Error adding domain:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET ALL DOMAINS ========================
exports.getDomains = async (req, res) => {
  try {
    const { workspaceId } = req.query;

    let query = {};
    if (workspaceId && workspaceId !== "personal") {
      const memberInfo = await getWorkspaceMember(workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied. Not an active member of this workspace." });
      }
      query.workspaceId = workspaceId;
    } else {
      query.userId = req.userId;
      query.workspaceId = null;
    }

    const domains = await CustomDomain.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      domains
    });
  } catch (error) {
    console.error("Error getting domains:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET DOMAIN BY ID ========================
exports.getDomainById = async (req, res) => {
  try {
    const domain = await CustomDomain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain not found" });
    }

    // Permission check
    if (domain.workspaceId) {
      const memberInfo = await getWorkspaceMember(domain.workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active") {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    } else {
      if (domain.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    return res.json({
      success: true,
      domain,
      dnsInstructions: {
        type: "CNAME",
        host: "@ or subdomain (e.g. links)",
        value: "shrinkly.app",
        text: "Add CNAME record pointing your domain to shrinkly.app"
      }
    });
  } catch (error) {
    console.error("Error getting domain by ID:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== VERIFY CUSTOM DOMAIN ========================
exports.verifyDomain = async (req, res) => {
  try {
    const domain = await CustomDomain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain not found" });
    }

    // Permission check
    if (domain.workspaceId) {
      const memberInfo = await getWorkspaceMember(domain.workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active" || (memberInfo.role !== "owner" && memberInfo.role !== "admin")) {
        return res.status(403).json({ success: false, message: "Access denied. Only Owner or Admin can verify domains." });
      }
    } else {
      if (domain.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    // Simulated DNS record verification. Marks domain as verified immediately
    domain.status = "verified";
    await domain.save();

    return res.json({
      success: true,
      message: "Domain verified successfully!",
      domain
    });
  } catch (error) {
    console.error("Error verifying domain:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== SET AS DEFAULT DOMAIN ========================
exports.setDefaultDomain = async (req, res) => {
  try {
    const domain = await CustomDomain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain not found" });
    }

    // Check if verified
    if (domain.status !== "verified") {
      return res.status(400).json({ success: false, message: "Only verified domains can be set as default" });
    }

    // Permission check
    if (domain.workspaceId) {
      const memberInfo = await getWorkspaceMember(domain.workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active" || (memberInfo.role !== "owner" && memberInfo.role !== "admin")) {
        return res.status(403).json({ success: false, message: "Access denied. Only Owner or Admin can manage custom domains." });
      }
    } else {
      if (domain.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    // Set all other domains in this context to isDefault = false
    const query = domain.workspaceId 
      ? { workspaceId: domain.workspaceId } 
      : { userId: req.userId, workspaceId: null };

    await CustomDomain.updateMany(query, { $set: { isDefault: false } });

    // Set this domain as default
    domain.isDefault = true;
    await domain.save();

    return res.json({
      success: true,
      message: "Domain set as default successfully",
      domain
    });
  } catch (error) {
    console.error("Error setting default domain:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== DELETE CUSTOM DOMAIN ========================
exports.deleteDomain = async (req, res) => {
  try {
    const domain = await CustomDomain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain not found" });
    }

    // Permission check
    if (domain.workspaceId) {
      const memberInfo = await getWorkspaceMember(domain.workspaceId, req.userId);
      if (!memberInfo || memberInfo.status !== "active" || (memberInfo.role !== "owner" && memberInfo.role !== "admin")) {
        return res.status(403).json({ success: false, message: "Access denied. Only Owner or Admin can delete custom domains." });
      }
    } else {
      if (domain.userId.toString() !== req.userId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    const domainName = domain.domain;

    // Delete custom domain
    await CustomDomain.findByIdAndDelete(req.params.id);

    // Update links that used this domain to go back to default domain
    await Link.updateMany({ domain: domainName }, { $set: { domain: "shrinkly.link" } });

    return res.json({
      success: true,
      message: "Domain deleted successfully. Associated links updated to default domain."
    });
  } catch (error) {
    console.error("Error deleting domain:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
