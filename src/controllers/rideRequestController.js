const rideRequestService = require("../services/rideRequestService");

exports.getBookingRequestsByRide = async (req, res, next) => {
  try {
    const requests = await rideRequestService.getBookingRequestsByRide(
      req.params.rideId,
      req.query.riderId
    );

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

exports.createBookingRequest = async (req, res, next) => {
  try {
    const request = await rideRequestService.createBookingRequest(
      req.params.rideId,
      req.body
    );

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBookingRequestStatus = async (req, res, next) => {
  try {
    const request = await rideRequestService.updateBookingRequestStatus(
      req.params.requestId,
      req.body.status,
      req.body.actor_user_id
    );

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

exports.getOpenRideRequestById = async (req, res, next) => {
  try {
    const request = await rideRequestService.getOpenRideRequestById(
      req.params.requestId
    );

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

exports.getOpenRideRequests = async (req, res, next) => {
  try {
    const requests = await rideRequestService.getOpenRideRequests(req.query);

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

exports.createOpenRideRequest = async (req, res, next) => {
  try {
    const request = await rideRequestService.createOpenRideRequest(req.body);

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOpenRideRequestStatus = async (req, res, next) => {
  try {
    const request = await rideRequestService.updateOpenRideRequestStatus(
      req.params.requestId,
      req.body
    );

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

exports.getIncomingRequests = async (req, res, next) => {
  try {
    const data = await rideRequestService.getIncomingRequests(req.query.driverId);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyRequests = async (req, res, next) => {
  try {
    const data = await rideRequestService.getMyRequests(req.query);

    res.json({
      success: true,
      view: req.query.view,
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyRides = async (req, res, next) => {
  try {
    const data = await rideRequestService.getMyRides(req.query);

    res.json({
      success: true,
      view: req.query.view,
      data
    });
  } catch (error) {
    next(error);
  }
};
