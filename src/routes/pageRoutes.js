const express = require("express");
const pageController = require("../controllers/pageController");

const router = express.Router();

router.get("/", pageController.getLandingPage);
router.get("/find-ride", pageController.getFindRidePage);
router.get("/post-a-ride", pageController.getPostRidePage);
router.get("/my-requests", pageController.getMyRequestsPage);
router.get("/my-rides", pageController.getMyRidesPage);
router.get("/ride-details", pageController.getRideDetailsPage);
router.get("/profile-settings", pageController.getProfileSettingsPage);
router.get("/vehicle-settings", pageController.getVehicleSettingsPage);
router.get("/messages", pageController.getMessagesPage);
router.get("/login", pageController.getLoginPage);
router.get("/signup", pageController.getSignupPage);

module.exports = router;
