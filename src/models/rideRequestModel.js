const db = require("../config/db");
const rideModel = require("./rideModel");
const userModel = require("./userModel");

let mockBookingRequests = [];

let mockOpenRideRequests = [];

async function getUsersById(userIds) {
  const usersById = {};

  await Promise.all(
    Array.from(new Set(userIds.filter(Boolean))).map(async (userId) => {
      try {
        usersById[userId] = await userModel.getById(userId);
      } catch (error) {
        usersById[userId] = null;
      }
    })
  );

  return usersById;
}

async function attachBookingContext(items) {
  const rides = await rideModel.getAll();
  const ridesById = {};

  rides.forEach((ride) => {
    ridesById[ride.id] = ride;
  });

  const usersById = await getUsersById(
    items.flatMap((item) => {
      const ride = item.ride_id ? ridesById[item.ride_id] : null;
      return [item.rider_id, ride ? ride.driver_id : null];
    })
  );

  return items.map((item) => {
    const rideDetails = item.ride_id ? ridesById[item.ride_id] || null : null;

    return {
      ...item,
      ride_details: rideDetails,
      rider_details: item.rider_id ? usersById[item.rider_id] || null : null,
      driver_details:
        rideDetails && rideDetails.driver_id
          ? usersById[rideDetails.driver_id] || null
          : null
    };
  });
}

async function attachOpenRequestContext(items) {
  const usersById = await getUsersById(
    items.flatMap((item) => [item.rider_id, item.accepted_driver_id])
  );

  return items.map((item) => {
    return {
      ...item,
      rider_details: item.rider_id ? usersById[item.rider_id] || null : null,
      accepted_driver_details:
        item.accepted_driver_id ? usersById[item.accepted_driver_id] || null : null
    };
  });
}

exports.getBookingRequestById = async (requestId) => {
  if (!db) {
    const item = mockBookingRequests.find((request) => request.id === requestId);
    const withRide = await attachBookingContext(item ? [item] : []);
    return withRide[0] || null;
  }

  const { data, error } = await db
    .from("booking_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (error) {
    throw error;
  }

  const withRide = await attachBookingContext([data]);
  return withRide[0];
};

exports.getBookingRequestsByRide = async (rideId, riderId) => {
  if (!db) {
    return attachBookingContext(
      mockBookingRequests.filter((item) => {
        if (item.ride_id !== rideId) {
          return false;
        }

        if (riderId && item.rider_id !== riderId) {
          return false;
        }

        return true;
      })
    );
  }

  let query = db
    .from("booking_requests")
    .select("*")
    .eq("ride_id", rideId);

  if (riderId) {
    query = query.eq("rider_id", riderId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return attachBookingContext(data || []);
};

exports.getBookingRequestByRideAndRider = async (rideId, riderId) => {
  const requests = await exports.getBookingRequestsByRide(rideId, riderId);
  return requests[0] || null;
};

exports.getBookingRequestsByRider = async (riderId) => {
  if (!db) {
    return attachBookingContext(
      mockBookingRequests.filter((item) => item.rider_id === riderId)
    );
  }

  const { data, error } = await db
    .from("booking_requests")
    .select("*")
    .eq("rider_id", riderId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return attachBookingContext(data || []);
};

exports.getIncomingBookingRequestsForDriver = async (driverId) => {
  const driverRides = await rideModel.getByDriverId(driverId);
  const driverRideIds = driverRides.map((ride) => ride.id);

  if (!db) {
    return attachBookingContext(
      mockBookingRequests.filter((item) => driverRideIds.includes(item.ride_id))
    );
  }

  if (driverRideIds.length === 0) {
    return [];
  }

  const { data, error } = await db
    .from("booking_requests")
    .select("*")
    .in("ride_id", driverRideIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return attachBookingContext(data || []);
};

exports.getAcceptedBookingRequestsByRider = async (riderId) => {
  const requests = await exports.getBookingRequestsByRider(riderId);
  return requests.filter((item) => item.status === "accepted");
};

exports.createBookingRequest = async (requestData) => {
  if (!db) {
    throw new Error("Supabase connection is required to create booking requests.");
  }

  const { data, error } = await db
    .from("booking_requests")
    .insert([requestData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.updateBookingRequestStatus = async (requestId, status) => {
  if (!db) {
    throw new Error("Supabase connection is required to update booking requests.");
  }

  const { data, error } = await db
    .from("booking_requests")
    .update({ status })
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.updateBookingRequestsStatusByRide = async (
  rideId,
  currentStatuses,
  nextStatus
) => {
  if (!db) {
    throw new Error("Supabase connection is required to update booking requests.");
  }

  let query = db
    .from("booking_requests")
    .update({ status: nextStatus })
    .eq("ride_id", rideId);

  if (currentStatuses && currentStatuses.length) {
    query = query.in("status", currentStatuses);
  }

  const { data, error } = await query.select("*");

  if (error) {
    throw error;
  }

  return data || [];
};

exports.getOpenRideRequestById = async (requestId) => {
  if (!db) {
    const items = await attachOpenRequestContext(
      mockOpenRideRequests.filter((request) => request.id === requestId)
    );
    return items[0] || null;
  }

  const { data, error } = await db
    .from("open_ride_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (error) {
    throw error;
  }

  const items = await attachOpenRequestContext([data]);
  return items[0] || null;
};

exports.getOpenRideRequests = async (filters = {}) => {
  if (!db) {
    return attachOpenRequestContext(mockOpenRideRequests.filter((item) => {
      if (filters.status && item.status !== filters.status) {
        return false;
      }

      if (filters.riderId && item.rider_id !== filters.riderId) {
        return false;
      }

      return true;
    }));
  }

  let query = db.from("open_ride_requests").select("*");

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.riderId) {
    query = query.eq("rider_id", filters.riderId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return attachOpenRequestContext(data || []);
};

exports.getIncomingOpenRideRequestsForDriver = async (driverId) => {
  if (!db) {
    return attachOpenRequestContext(mockOpenRideRequests.filter((item) => {
      return item.status === "open" || item.accepted_driver_id === driverId;
    }));
  }

  const { data: openItems, error: openError } = await db
    .from("open_ride_requests")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (openError) {
    throw openError;
  }

  const { data: acceptedItems, error: acceptedError } = await db
    .from("open_ride_requests")
    .select("*")
    .eq("accepted_driver_id", driverId)
    .order("created_at", { ascending: false });

  if (acceptedError) {
    throw acceptedError;
  }

  const itemsById = {};

  [...(openItems || []), ...(acceptedItems || [])].forEach((item) => {
    itemsById[item.id] = item;
  });

  return attachOpenRequestContext(Object.values(itemsById));
};

exports.getAcceptedOpenRideRequestsByRider = async (riderId) => {
  const items = await exports.getOpenRideRequests({ riderId });
  return items.filter((item) => item.status === "accepted");
};

exports.getAcceptedOpenRideRequestsByDriver = async (driverId) => {
  if (!db) {
    return attachOpenRequestContext(mockOpenRideRequests.filter((item) => {
      return item.accepted_driver_id === driverId && item.status === "accepted";
    }));
  }

  const { data, error } = await db
    .from("open_ride_requests")
    .select("*")
    .eq("accepted_driver_id", driverId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return attachOpenRequestContext(data || []);
};

exports.createOpenRideRequest = async (requestData) => {
  if (!db) {
    throw new Error("Supabase connection is required to create open ride requests.");
  }

  const { data, error } = await db
    .from("open_ride_requests")
    .insert([requestData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.updateOpenRideRequestStatus = async (requestId, updateData) => {
  if (!db) {
    throw new Error("Supabase connection is required to update open ride requests.");
  }

  const { data, error } = await db
    .from("open_ride_requests")
    .update(updateData)
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
