const db = require("../config/db");

let mockRides = [];

exports.getAll = async (filters = {}) => {
  if (!db) {
    return mockRides.filter((ride) => {
      if (filters.driverId && ride.driver_id !== filters.driverId) {
        return false;
      }

      if (filters.location) {
        const search = String(filters.location).toLowerCase();
        const matches =
          ride.origin.toLowerCase().includes(search) ||
          ride.destination.toLowerCase().includes(search);

        if (!matches) {
          return false;
        }
      }

      if (filters.from && !ride.origin.toLowerCase().includes(String(filters.from).toLowerCase())) {
        return false;
      }

      if (filters.to && !ride.destination.toLowerCase().includes(String(filters.to).toLowerCase())) {
        return false;
      }

      if (filters.time && ride.ride_time !== filters.time) {
        return false;
      }

      if (filters.date && ride.ride_date !== filters.date) {
        return false;
      }

      return true;
    });
  }

  let query = db.from("rides").select("*");

  if (filters.driverId) {
    query = query.eq("driver_id", filters.driverId);
  }

  if (filters.location) {
    query = query.or(
      `origin.ilike.%${filters.location}%,destination.ilike.%${filters.location}%`
    );
  }

  if (filters.from) {
    query = query.ilike("origin", `%${filters.from}%`);
  }

  if (filters.to) {
    query = query.ilike("destination", `%${filters.to}%`);
  }

  if (filters.time) {
    query = query.eq("ride_time", filters.time);
  }

  if (filters.date) {
    query = query.eq("ride_date", filters.date);
  }

  const { data, error } = await query.order("ride_date").order("ride_time");

  if (error) {
    throw error;
  }

  return data || [];
};

exports.getById = async (rideId) => {
  if (!db) {
    return mockRides.find((item) => item.id === rideId) || null;
  }

  const { data, error } = await db
    .from("rides")
    .select("*")
    .eq("id", rideId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.getByDriverId = async (driverId) => {
  return exports.getAll({ driverId });
};

exports.getActiveByDriverId = async (driverId) => {
  const rides = await exports.getByDriverId(driverId);

  return rides.filter((ride) => {
    return ride.status !== "completed" && ride.status !== "cancelled";
  });
};

exports.create = async (rideData) => {
  if (!db) {
    throw new Error("Supabase connection is required to create rides.");
  }

  const { data, error } = await db
    .from("rides")
    .insert([rideData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.update = async (rideId, updates) => {
  if (!db) {
    throw new Error("Supabase connection is required to update rides.");
  }

  const { data, error } = await db
    .from("rides")
    .update(updates)
    .eq("id", rideId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.remove = async (rideId) => {
  if (!db) {
    throw new Error("Supabase connection is required to delete rides.");
  }

  const { error } = await db.from("rides").delete().eq("id", rideId);

  if (error) {
    throw error;
  }

  return { id: rideId, deleted: true };
};
