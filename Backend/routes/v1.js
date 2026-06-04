const router = require("express").Router();
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const { developerApiLimiter } = require("../utils/rateLimiters");

// Controllers
const {
  createShortLink,
  getAllLinks,
  getLinkById,
  deleteLink
} = require("../controllers/linkController");
const { getLinkAnalytics } = require("../controllers/analyticsController");

// Secure all endpoints with developer rate limiter and API Key authenticator
router.use(developerApiLimiter);
router.use(apiKeyAuth);

// Links routes
router.post("/links", createShortLink);
router.get("/links", getAllLinks);
router.get("/links/:id", getLinkById);
router.delete("/links/:id", deleteLink);

// Analytics route
router.get("/analytics/:linkId", getLinkAnalytics);

module.exports = router;
