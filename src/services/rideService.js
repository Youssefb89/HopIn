const rideModel = require("../models/rideModel");

function getScheduledDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) {
    return null;
  }

  const scheduledDate = new Date(`${dateValue}T${String(timeValue).slice(0, 8)}`);

  if (Number.isNaN(scheduledDate.getTime())) {
    return null;
  }

  return scheduledDate;
}

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

exports.updateRideStatus = async (rideId, status, actorUserId) => {
  if (!rideId || !status) {
    throw new Error("Ride id and status are required.");
  }

  const ride = await rideModel.getById(rideId);

  if (!ride) {
    throw new Error("Ride not found.");
  }

  if (status !== "cancelled") {
    if (status !== "completed") {
      return rideModel.update(rideId, { status: status });
    }

    if (actorUserId && actorUserId !== ride.driver_id) {
      throw new Error("Only the driver who posted this ride can mark it completed.");
    }

    const scheduledDate = getScheduledDateTime(ride.ride_date, ride.ride_time);

    if (!scheduledDate || scheduledDate.getTime() > Date.now()) {
      throw new Error("This ride cannot be marked completed until its scheduled date and time have passed.");
    }

    const rideRequestModel = require("../models/rideRequestModel");
    const updatedRide = await rideModel.update(rideId, { status: "completed" });

    await rideRequestModel.updateBookingRequestsStatusByRide(
      rideId,
      ["accepted"],
      "completed"
    );

    return updatedRide;
  }

  if (actorUserId && actorUserId !== ride.driver_id) {
    throw new Error("Only the driver who posted this ride can cancel it.");
  }

  if (ride.status === "cancelled") {
    return ride;
  }

  const updatedRide = await rideModel.update(rideId, { status: "cancelled" });
  const rideRequestModel = require("../models/rideRequestModel");

  await rideRequestModel.updateBookingRequestsStatusByRide(
    rideId,
    ["requested", "accepted", "ignored"],
    "cancelled"
  );

  return updatedRide;
};

exports.deleteRide = async (rideId) => {
  if (!rideId) {
    throw new Error("Ride id is required.");
  }

  return rideModel.remove(rideId);
};
