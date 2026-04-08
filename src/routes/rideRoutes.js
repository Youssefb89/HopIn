const express = require("express");
const rideController = require("../controllers/rideController");

const router = express.Router();

router.get("/", rideController.getRides);
router.post("/", rideController.createRide);
router.patch("/:id/status", rideController.updateRideStatus);
router.get("/:id", rideController.getRideById);
router.put("/:id", rideController.updateRide);
router.delete("/:id", rideController.deleteRide);

module.exports = router;
