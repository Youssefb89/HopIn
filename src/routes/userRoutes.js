const express = require("express");
const userController = require("../controllers/userController");
const ratingController = require("../controllers/ratingController");

const router = express.Router();

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.get("/:id/vehicles", userController.getUserVehicles);
router.post("/:id/vehicles", userController.createUserVehicle);
router.put("/:id/vehicles/:vehicleId", userController.updateUserVehicle);
router.get("/:userId/ratings", ratingController.getRatingsForUser);

module.exports = router;
