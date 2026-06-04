/**
 * Role-Based Access Control (RBAC) Middleware
 * Protects routes based on user roles
 */

const User = require("../models/users");

// Define role hierarchy
const ROLES = {
  user: 1,      // Regular user
  admin: 2,     // Can manage users and view all links
  superadmin: 3 // Can manage everything
};

/**
 * Middleware to check if user has required role(s)
 * Usage: router.get('/admin/users', requireRole(['admin', 'superadmin']), handler)
 */
const requireRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Access denied. No token provided." 
        });
      }

      // Use role from JWT if available, otherwise fall back to DB query
      let userRole = req.userRole;
      
      if (!userRole) {
        const user = await User.findById(req.userId).select("role");
        
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: "User not found" 
          });
        }
        
        userRole = user.role || "user";
      }
      
      // Check if user role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. This action requires ${allowedRoles.join(" or ")} role.`
        });
      }

      // Attach user info to request
      req.userRole = userRole;
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Server error" 
      });
    }
  };
};

/**
 * Middleware to check if user is admin or superadmin
 */
const isAdmin = requireRole(["admin", "superadmin"]);

/**
 * Middleware to check if user is superadmin
 */
const isSuperAdmin = requireRole(["superadmin"]);

module.exports = {
  requireRole,
  isAdmin,
  isSuperAdmin,
  ROLES
};
