const express = require("express");
const rideRequestController = require("../controllers/rideRequestController");

const router = express.Router();

router.get("/rides/:rideId/booking-requests", rideRequestController.getBookingRequestsByRide);
router.post("/rides/:rideId/booking-requests", rideRequestController.createBookingRequest);
router.patch("/booking-requests/:requestId/status", rideRequestController.updateBookingRequestStatus);
router.get("/open-ride-requests/:requestId", rideRequestController.getOpenRideRequestById);
router.get("/open-ride-requests", rideRequestController.getOpenRideRequests);
router.post("/open-ride-requests", rideRequestController.createOpenRideRequest);
router.patch("/open-ride-requests/:requestId/status", rideRequestController.updateOpenRideRequestStatus);
router.get("/incoming-requests", rideRequestController.getIncomingRequests);
router.get("/my-requests", rideRequestController.getMyRequests);
router.get("/my-rides", rideRequestController.getMyRides);

module.exports = router;
