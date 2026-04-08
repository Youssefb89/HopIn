const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/config", authController.getPublicConfig);
router.get("/profile-link", authController.getLinkedProfile);
router.post("/link-profile", authController.linkProfile);
router.post("/sync-profile", authController.syncProfileForAuth);

module.exports = router;
