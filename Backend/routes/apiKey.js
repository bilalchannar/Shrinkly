const router = require("express").Router();
const { auth } = require("../middleware/auth");
const {
  createApiKey,
  getApiKeys,
  revokeApiKey,
  deleteApiKey
} = require("../controllers/apiKeyController");

// Protect all key management routes with JWT session auth
router.use(auth);

router.post("/", createApiKey);
router.get("/", getApiKeys);
router.patch("/:id/revoke", revokeApiKey);
router.delete("/:id", deleteApiKey);

module.exports = router;
