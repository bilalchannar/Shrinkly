const router = require("express").Router();
const { createShortLink, redirectToOriginal } = require("../controllers/linkController");

router.post("/shorten", createShortLink);
router.get("/:code", redirectToOriginal);

module.exports = router;
