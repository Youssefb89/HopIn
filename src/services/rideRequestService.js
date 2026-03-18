const rideModel = require("../models/rideModel");
const rideRequestModel = require("../models/rideRequestModel");

exports.getBookingRequestsByRide = async (rideId, riderId) => {
  if (!rideId) {
    throw new Error("rideId is required.");
  }

  return rideRequestModel.getBookingRequestsByRide(rideId, riderId);
};

exports.createBookingRequest = async (rideId, requestData) => {
  const ride = await rideModel.getById(rideId);
  const payload = {
    ride_id: rideId,
    rider_id: requestData.rider_id,
    seats_requested: Number(requestData.seats_requested || 1),
    message: requestData.message || null,
    status: "requested"
  };

  if (!payload.ride_id || !payload.rider_id) {
    throw new Error("rideId and rider_id are required.");
  }

  if (!ride) {
    throw new Error("Ride not found.");
  }

  if (ride.driver_id === payload.rider_id) {
    throw new Error("You cannot request your own ride.");
  }

  if (["full", "cancelled", "completed"].includes(ride.status)) {
    throw new Error("This ride is not accepting requests right now.");
  }

  const existingRequest =
    await rideRequestModel.getBookingRequestByRideAndRider(
      payload.ride_id,
      payload.rider_id
    );

  if (existingRequest) {
    throw new Error("Request already sent for this ride.");
  }

  return rideRequestModel.createBookingRequest(payload);
};

exports.updateBookingRequestStatus = async (requestId, status) => {
  if (!requestId || !status) {
    throw new Error("requestId and status are required.");
  }

  const bookingRequest = await rideRequestModel.getBookingRequestById(requestId);

  if (!bookingRequest) {
    throw new Error("Booking request not found.");
  }

  if (status === "accepted") {
    if (bookingRequest.status === "accepted") {
      return bookingRequest;
    }

    if (bookingRequest.status !== "requested") {
      throw new Error("Only requested booking requests can be accepted.");
    }

    const ride = await rideModel.getById(bookingRequest.ride_id);

    if (!ride) {
      throw new Error("Ride not found.");
    }

    if (["cancelled", "completed"].includes(ride.status)) {
      throw new Error("This ride can no longer accept requests.");
    }

    const seatsRequested = Number(bookingRequest.seats_requested || 1);
    const seatsAvailable = Number(ride.seats_available || 0);

    if (seatsRequested > seatsAvailable) {
      throw new Error("Not enough seats are available for this request.");
    }

    const nextSeatsAvailable = seatsAvailable - seatsRequested;

    await rideModel.update(ride.id, {
      seats_available: nextSeatsAvailable,
      status: nextSeatsAvailable === 0 ? "full" : "open"
    });

    await rideRequestModel.updateBookingRequestStatus(requestId, status);
    return rideRequestModel.getBookingRequestById(requestId);
  }

  if (bookingRequest.status === "accepted") {
    throw new Error("Accepted booking requests cannot be changed from this screen.");
  }

  await rideRequestModel.updateBookingRequestStatus(requestId, status);
  return rideRequestModel.getBookingRequestById(requestId);
};

exports.getOpenRideRequests = async (filters) => {
  return rideRequestModel.getOpenRideRequests(filters);
};

exports.getOpenRideRequestById = async (requestId) => {
  if (!requestId) {
    throw new Error("requestId is required.");
  }

  const request = await rideRequestModel.getOpenRideRequestById(requestId);

  if (!request) {
    throw new Error("Open ride request not found.");
  }

  return request;
};

exports.createOpenRideRequest = async (requestData) => {
  const payload = {
    rider_id: requestData.rider_id,
    accepted_driver_id: null,
    origin: requestData.origin,
    destination: requestData.destination,
    ride_date: requestData.ride_date,
    ride_time: requestData.ride_time,
    seats_needed: Number(requestData.seats_needed || 1),
    notes: requestData.notes || null,
    status: "open"
  };

  if (
    !payload.rider_id ||
    !payload.origin ||
    !payload.destination ||
    !payload.ride_date ||
    !payload.ride_time
  ) {
    throw new Error(
      "rider_id, origin, destination, ride_date, and ride_time are required."
    );
  }

  return rideRequestModel.createOpenRideRequest(payload);
};

exports.updateOpenRideRequestStatus = async (requestId, updates) => {
  if (!requestId || !updates.status) {
    throw new Error("requestId and status are required.");
  }

  if (updates.status === "accepted" && !updates.accepted_driver_id) {
    throw new Error(
      "accepted_driver_id is required when accepting an open ride request."
    );
  }

  return rideRequestModel.updateOpenRideRequestStatus(requestId, updates);
};

exports.getIncomingRequests = async (driverId) => {
  if (!driverId) {
    throw new Error("driverId is required.");
  }

  const rideBookingRequests =
    await rideRequestModel.getIncomingBookingRequestsForDriver(driverId);
  const openRideRequests =
    await rideRequestModel.getIncomingOpenRideRequestsForDriver(driverId);

  return {
    ride_booking_requests: rideBookingRequests,
    open_ride_requests: openRideRequests
  };
};

exports.getMyRequests = async (filters) => {
  if (!filters.userId || !filters.view) {
    throw new Error("userId and view are required.");
  }

  if (filters.view === "rider") {
    return {
      sent_booking_requests: await rideRequestModel.getBookingRequestsByRider(
        filters.userId
      ),
      my_open_ride_requests: await rideRequestModel.getOpenRideRequests({
        riderId: filters.userId
      })
    };
  }

  if (filters.view === "driver") {
    return {
      requests_on_my_rides:
        await rideRequestModel.getIncomingBookingRequestsForDriver(filters.userId),
      rider_open_requests:
        await rideRequestModel.getIncomingOpenRideRequestsForDriver(filters.userId)
    };
  }

  throw new Error("view must be rider or driver.");
};

exports.getMyRides = async (filters) => {
  if (!filters.userId || !filters.view) {
    throw new Error("userId and view are required.");
  }

  if (filters.view === "rider") {
    return {
      upcoming_booked_rides:
        await rideRequestModel.getAcceptedBookingRequestsByRider(filters.userId),
      accepted_open_ride_requests:
        await rideRequestModel.getAcceptedOpenRideRequestsByRider(filters.userId)
    };
  }

  if (filters.view === "driver") {
    return {
      upcoming_posted_rides: await rideModel.getActiveByDriverId(filters.userId),
      accepted_rider_requests:
        await rideRequestModel.getAcceptedOpenRideRequestsByDriver(filters.userId)
    };
  }

  throw new Error("view must be rider or driver.");
};
