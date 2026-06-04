const User = require("../models/users");

/**
 * Middleware to verify that the logged-in user has admin or superadmin privileges.
 */
const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Access denied. No token provided." 
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found." 
      });
    }

    if (user.role !== "admin" && user.role !== "superadmin" && !user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin role required." 
      });
    }

    req.userRole = user.role || "user";
    next();
  } catch (error) {
    console.error("Admin verification error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

module.exports = adminMiddleware;
