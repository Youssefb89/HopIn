const userService = require("../services/userService");

exports.getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserVehicles = async (req, res, next) => {
  try {
    const vehicles = await userService.getUserVehicles(req.params.id);

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    next(error);
  }
};

exports.createUserVehicle = async (req, res, next) => {
  try {
    const vehicle = await userService.createUserVehicle(req.params.id, req.body);

    res.status(201).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserVehicle = async (req, res, next) => {
  try {
    const vehicle = await userService.updateUserVehicle(
      req.params.vehicleId,
      req.body
    );

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};
