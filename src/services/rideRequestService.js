const rideModel = require("../models/rideModel");
const rideRequestModel = require("../models/rideRequestModel");

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

function isActiveBookingStatus(status) {
  return status === "requested" || status === "accepted";
}

function isRiderBookingUpdateStatus(status) {
  return status === "declined" || status === "ignored" || status === "cancelled";
}

function isDriverBookingUpdateStatus(status) {
  return status === "cancelled";
}

function isActiveOpenRideStatus(status) {
  return status === "open" || status === "accepted";
}

function isRiderOpenRideUpdateStatus(status) {
  return status === "declined" || status === "cancelled";
}

function isDriverOpenRideUpdateStatus(status) {
  return status === "cancelled";
}

function buildRiderUpdateFromBookingRequest(item) {
  const ride = item.ride_details || {};
  const driverName =
    item.driver_details && item.driver_details.full_name
      ? item.driver_details.full_name
      : "the driver";

  return {
    id: item.id,
    type: "booking_request",
    status: item.status,
    created_at: item.created_at,
    updated_at: item.updated_at,
    origin: ride.origin || "your pickup point",
    destination: ride.destination || "your destination",
    actor_name: driverName,
    detail_url: ride.id ? `/ride-details?id=${ride.id}` : "/my-requests?view=rider",
    message:
      item.status === "declined"
        ? `Your request from ${ride.origin || "your pickup point"} to ${ride.destination || "your destination"} was declined by ${driverName}.`
        : `Your request from ${ride.origin || "your pickup point"} to ${ride.destination || "your destination"} is no longer active.`
  };
}

function buildRiderUpdateFromOpenRideRequest(item) {
  const driverName =
    item.accepted_driver_details && item.accepted_driver_details.full_name
      ? item.accepted_driver_details.full_name
      : "a driver";

  return {
    id: item.id,
    type: "open_ride_request",
    status: item.status,
    created_at: item.created_at,
    updated_at: item.updated_at,
    origin: item.origin || "your pickup point",
    destination: item.destination || "your destination",
    actor_name: driverName,
    detail_url: `/ride-details?openRequestId=${item.id}`,
    message:
      item.status === "declined"
        ? `Your ride request from ${item.origin || "your pickup point"} to ${item.destination || "your destination"} was rejected by ${driverName}.`
        : `Your ride request from ${item.origin || "your pickup point"} to ${item.destination || "your destination"} is no longer active.`
  };
}

function buildDriverUpdateFromBookingRequest(item) {
  const ride = item.ride_details || {};
  const riderName =
    item.rider_details && item.rider_details.full_name
      ? item.rider_details.full_name
      : "the rider";

  return {
    id: item.id,
    type: "booking_request",
    status: item.status,
    created_at: item.created_at,
    updated_at: item.updated_at,
    detail_url: ride.id ? `/ride-details?id=${ride.id}` : "/my-requests?view=driver",
    message:
      item.status === "cancelled"
        ? `${riderName} cancelled the request from ${ride.origin || "their pickup point"} to ${ride.destination || "their destination"}.`
        : `There is an update on a rider request for ${ride.origin || "your route"}.`
  };
}

function buildDriverUpdateFromOpenRideRequest(item) {
  const riderName =
    item.rider_details && item.rider_details.full_name
      ? item.rider_details.full_name
      : "the rider";

  return {
    id: item.id,
    type: "open_ride_request",
    status: item.status,
    created_at: item.created_at,
    updated_at: item.updated_at,
    detail_url: `/ride-details?openRequestId=${item.id}`,
    message:
      item.status === "cancelled"
        ? `${riderName} cancelled the matched ride request from ${item.origin || "their pickup point"} to ${item.destination || "their destination"}.`
        : `There is an update on a matched rider request.`
  };
}

function sortByNewestUpdate(firstItem, secondItem) {
  const firstDate = new Date(firstItem.updated_at || firstItem.created_at || 0).getTime();
  const secondDate = new Date(secondItem.updated_at || secondItem.created_at || 0).getTime();

  return secondDate - firstDate;
}

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

exports.updateBookingRequestStatus = async (requestId, status, actorUserId) => {
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

  if (status === "cancelled") {
    const ride = await rideModel.getById(bookingRequest.ride_id);

    if (!ride) {
      throw new Error("Ride not found.");
    }

    if (
      actorUserId &&
      actorUserId !== bookingRequest.rider_id &&
      actorUserId !== ride.driver_id
    ) {
      throw new Error("You cannot cancel this booking request.");
    }

    if (bookingRequest.status === "cancelled") {
      return bookingRequest;
    }

    if (!["requested", "accepted"].includes(bookingRequest.status)) {
      throw new Error("Only requested or accepted booking requests can be cancelled.");
    }

    if (
      bookingRequest.status === "accepted" &&
      !["cancelled", "completed"].includes(ride.status)
    ) {
      const seatsRequested = Number(bookingRequest.seats_requested || 1);
      const seatsAvailable = Number(ride.seats_available || 0);

      await rideModel.update(ride.id, {
        seats_available: seatsAvailable + seatsRequested,
        status: "open"
      });
    }

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

  const openRideRequest = await rideRequestModel.getOpenRideRequestById(requestId);

  if (!openRideRequest) {
    throw new Error("Open ride request not found.");
  }

  if (
    (updates.status === "accepted" || updates.status === "declined") &&
    !updates.accepted_driver_id
  ) {
    throw new Error(
      "accepted_driver_id is required when responding to an open ride request."
    );
  }

  if (
    (updates.status === "accepted" || updates.status === "declined") &&
    openRideRequest.rider_id === updates.accepted_driver_id
  ) {
    throw new Error("You cannot respond to your own ride request as the driver.");
  }

  if (updates.status === "accepted" || updates.status === "declined") {
    if (openRideRequest.status !== "open") {
      throw new Error("Only open ride requests can be accepted or declined.");
    }
  }

  if (updates.status === "cancelled") {
    if (openRideRequest.status === "cancelled") {
      return openRideRequest;
    }

    if (!["open", "accepted"].includes(openRideRequest.status)) {
      throw new Error("Only open or accepted ride requests can be cancelled.");
    }

    if (
      updates.actor_user_id &&
      updates.actor_user_id !== openRideRequest.rider_id &&
      updates.actor_user_id !== openRideRequest.accepted_driver_id
    ) {
      throw new Error("You cannot cancel this ride request.");
    }
  }

  if (updates.status === "completed") {
    if (openRideRequest.status === "completed") {
      return openRideRequest;
    }

    if (openRideRequest.status !== "accepted") {
      throw new Error("Only accepted ride requests can be marked completed.");
    }

    if (
      updates.actor_user_id &&
      updates.actor_user_id !== openRideRequest.accepted_driver_id
    ) {
      throw new Error("Only the accepted driver can mark this ride request completed.");
    }

    const scheduledDate = getScheduledDateTime(
      openRideRequest.ride_date,
      openRideRequest.ride_time
    );

    if (!scheduledDate || scheduledDate.getTime() > Date.now()) {
      throw new Error("This ride request cannot be marked completed until its scheduled date and time have passed.");
    }
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
    const bookingRequests = await rideRequestModel.getBookingRequestsByRider(
      filters.userId
    );
    const openRideRequests = await rideRequestModel.getOpenRideRequests({
      riderId: filters.userId
    });

    return {
      sent_booking_requests: bookingRequests.filter((item) =>
        isActiveBookingStatus(item.status)
      ),
      my_open_ride_requests: openRideRequests.filter((item) =>
        isActiveOpenRideStatus(item.status)
      ),
      rider_updates: [
        ...bookingRequests
          .filter((item) => isRiderBookingUpdateStatus(item.status))
          .map(buildRiderUpdateFromBookingRequest),
        ...openRideRequests
          .filter((item) => isRiderOpenRideUpdateStatus(item.status))
          .map(buildRiderUpdateFromOpenRideRequest)
      ].sort(sortByNewestUpdate)
    };
  }

  if (filters.view === "driver") {
    const bookingRequests =
      await rideRequestModel.getIncomingBookingRequestsForDriver(filters.userId);
    const openRideRequests =
      await rideRequestModel.getIncomingOpenRideRequestsForDriver(filters.userId);

    return {
      requests_on_my_rides: bookingRequests.filter((item) =>
        isActiveBookingStatus(item.status)
      ),
      rider_open_requests: openRideRequests.filter((item) => {
        if (item.status === "open") {
          return true;
        }

        return (
          item.status === "accepted" &&
          item.accepted_driver_id === filters.userId
        );
      }),
      driver_updates: [
        ...bookingRequests
          .filter((item) => isDriverBookingUpdateStatus(item.status))
          .map(buildDriverUpdateFromBookingRequest),
        ...openRideRequests
          .filter((item) => {
            return (
              item.accepted_driver_id === filters.userId &&
              isDriverOpenRideUpdateStatus(item.status)
            );
          })
          .map(buildDriverUpdateFromOpenRideRequest)
      ].sort(sortByNewestUpdate)
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
        await rideRequestModel.getAcceptedOpenRideRequestsByRider(filters.userId),
      completed_booked_rides:
        (await rideRequestModel.getBookingRequestsByRider(filters.userId)).filter(
          (item) => item.status === "completed"
        ),
      completed_open_ride_requests:
        (await rideRequestModel.getOpenRideRequests({ riderId: filters.userId })).filter(
          (item) => item.status === "completed"
        )
    };
  }

  if (filters.view === "driver") {
    const upcomingPostedRides = await rideModel.getActiveByDriverId(filters.userId);
    const completedPostedRides = (await rideModel.getByDriverId(filters.userId)).filter(
      (item) => item.status === "completed"
    );
    const bookingRequests =
      await rideRequestModel.getIncomingBookingRequestsForDriver(filters.userId);
    const acceptedRiderRequests =
      await rideRequestModel.getAcceptedOpenRideRequestsByDriver(filters.userId);
    const completedRiderRequests = (await rideRequestModel.getIncomingOpenRideRequestsForDriver(
      filters.userId
    )).filter((item) => item.status === "completed");
    const acceptedCountsByRideId = {};

    bookingRequests.forEach((item) => {
      if (!item.ride_id) {
        return;
      }

      if (!acceptedCountsByRideId[item.ride_id]) {
        acceptedCountsByRideId[item.ride_id] = {
          accepted_booking_count: 0,
          confirmed_seat_count: 0
        };
      }

      if (item.status === "accepted" || item.status === "completed") {
        acceptedCountsByRideId[item.ride_id].accepted_booking_count += 1;
        acceptedCountsByRideId[item.ride_id].confirmed_seat_count += Number(
          item.seats_requested || 1
        );
      }
    });

    function attachAcceptedCounts(ride) {
      const countData = acceptedCountsByRideId[ride.id] || {
        accepted_booking_count: 0,
        confirmed_seat_count: 0
      };

      return {
        ...ride,
        accepted_booking_count: countData.accepted_booking_count,
        confirmed_seat_count: countData.confirmed_seat_count
      };
    }

    return {
      upcoming_posted_rides: upcomingPostedRides.map(attachAcceptedCounts),
      accepted_rider_requests: acceptedRiderRequests,
      completed_posted_rides: completedPostedRides.map(attachAcceptedCounts),
      completed_rider_requests: completedRiderRequests
    };
  }

  throw new Error("view must be rider or driver.");
};
