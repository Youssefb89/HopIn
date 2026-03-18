const userModel = require("../models/userModel");
const vehicleModel = require("../models/vehicleModel");
const ratingModel = require("../models/ratingModel");

exports.getUsers = async () => {
  return userModel.getAll();
};

exports.getUserById = async (userId) => {
  if (!userId) {
    throw new Error("User id is required.");
  }

  const user = await userModel.getById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
};

exports.updateUser = async (userId, updates) => {
  if (!userId) {
    throw new Error("User id is required.");
  }

  return userModel.update(userId, updates);
};

exports.getUserVehicles = async (userId) => {
  if (!userId) {
    throw new Error("User id is required.");
  }

  return vehicleModel.getByUserId(userId);
};

exports.createUserVehicle = async (userId, vehicleData) => {
  if (!userId) {
    throw new Error("User id is required.");
  }

  return vehicleModel.create({
    user_id: userId,
    make: vehicleData.make,
    model: vehicleData.model,
    vehicle_year: vehicleData.vehicle_year || null,
    color: vehicleData.color || null,
    license_plate: vehicleData.license_plate || null,
    seats_available: Number(vehicleData.seats_available || 1),
    photo_url: vehicleData.photo_url || null
  });
};

exports.updateUserVehicle = async (vehicleId, vehicleData) => {
  if (!vehicleId) {
    throw new Error("Vehicle id is required.");
  }

  return vehicleModel.update(vehicleId, {
    make: vehicleData.make,
    model: vehicleData.model,
    vehicle_year: vehicleData.vehicle_year || null,
    color: vehicleData.color || null,
    license_plate: vehicleData.license_plate || null,
    seats_available: Number(vehicleData.seats_available || 1),
    photo_url: vehicleData.photo_url || null
  });
};

exports.getUserRatings = async (userId) => {
  if (!userId) {
    throw new Error("User id is required.");
  }

  return ratingModel.getByUserId(userId);
};
