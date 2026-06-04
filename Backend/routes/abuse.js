const router = require("express").Router();
const { submitReport } = require("../controllers/abuseController");

router.post("/report", submitReport);

module.exports = router;
