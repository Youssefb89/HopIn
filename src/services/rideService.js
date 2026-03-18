const rideModel = require("../models/rideModel");

exports.getRides = async (filters) => {
  return rideModel.getAll(filters);
};

exports.getRideById = async (rideId) => {
  if (!rideId) {
    throw new Error("Ride id is required.");
  }

  const ride = await rideModel.getById(rideId);

  if (!ride) {
    throw new Error("Ride not found.");
  }

  return ride;
};

exports.createRide = async (rideData) => {
  const payload = {
    driver_id: rideData.driver_id,
    vehicle_id: rideData.vehicle_id || null,
    origin: rideData.origin,
    destination: rideData.destination,
    ride_date: rideData.ride_date,
    ride_time: rideData.ride_time,
    seats_available: Number(rideData.seats_available || 1),
    notes: rideData.notes || null,
    status: "open"
  };

  if (
    !payload.driver_id ||
    !payload.origin ||
    !payload.destination ||
    !payload.ride_date ||
    !payload.ride_time
  ) {
    throw new Error(
      "driver_id, origin, destination, ride_date, and ride_time are required."
    );
  }

  return rideModel.create(payload);
};

exports.updateRide = async (rideId, updates) => {
  if (!rideId) {
    throw new Error("Ride id is required.");
  }

  return rideModel.update(rideId, updates);
};

exports.deleteRide = async (rideId) => {
  if (!rideId) {
    throw new Error("Ride id is required.");
  }

  return rideModel.remove(rideId);
};
