const jwt = require("jsonwebtoken");
const TokenBlacklist = require("../models/TokenBlacklist");

/**
 * Require valid JWT authentication.
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false, 
        message: "Access denied. No token provided." 
      });
    }

    const token = authHeader.split(" ")[1];
    
    // Check if token is blacklisted
    const blacklistedToken = await TokenBlacklist.findOne({ token });
    if (blacklistedToken) {
      return res.status(401).json({ 
        success: false, 
        message: "Token has been revoked. Please login again." 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired. Please login again." 
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: "Invalid token." 
    });
  }
};

/**
 * Optional authentication that populates req.userId if a valid token is provided, otherwise proceeds.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      
      // Check if token is blacklisted
      const blacklistedToken = await TokenBlacklist.findOne({ token });
      if (!blacklistedToken) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { auth, optionalAuth };
