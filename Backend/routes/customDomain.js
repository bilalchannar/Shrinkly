const router = require("express").Router();
const { auth } = require("../middleware/auth");
const {
  addDomain,
  getDomains,
  getDomainById,
  verifyDomain,
  setDefaultDomain,
  deleteDomain
} = require("../controllers/customDomainController");

// Secure all custom domain endpoints with auth middleware
router.use(auth);

router.post("/", addDomain);
router.get("/", getDomains);
router.get("/:id", getDomainById);
router.post("/:id/verify", verifyDomain);
router.patch("/:id/default", setDefaultDomain);
router.delete("/:id", deleteDomain);

module.exports = router;
