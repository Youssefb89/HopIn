const rideService = require("../services/rideService");

exports.getRides = async (req, res, next) => {
  try {
    const rides = await rideService.getRides(req.query);

    res.json({
      success: true,
      count: rides.length,
      data: rides
    });
  } catch (error) {
    next(error);
  }
};

exports.getRideById = async (req, res, next) => {
  try {
    const ride = await rideService.getRideById(req.params.id);

    res.json({
      success: true,
      data: ride
    });
  } catch (error) {
    next(error);
  }
};

exports.createRide = async (req, res, next) => {
  try {
    const ride = await rideService.createRide(req.body);

    res.status(201).json({
      success: true,
      data: ride
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRide = async (req, res, next) => {
  try {
    const ride = await rideService.updateRide(req.params.id, req.body);

    res.json({
      success: true,
      data: ride
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRideStatus = async (req, res, next) => {
  try {
    const ride = await rideService.updateRideStatus(
      req.params.id,
      req.body.status,
      req.body.actor_user_id
    );

    res.json({
      success: true,
      data: ride
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteRide = async (req, res, next) => {
  try {
    const result = await rideService.deleteRide(req.params.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
