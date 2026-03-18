const db = require("../config/db");

let mockVehicles = [];

exports.getByUserId = async (userId) => {
  if (!db) {
    return mockVehicles.filter((item) => item.user_id === userId);
  }

  const { data, error } = await db
    .from("vehicles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

exports.create = async (vehicleData) => {
  if (!db) {
    throw new Error("Supabase connection is required to create vehicles.");
  }

  const { data, error } = await db
    .from("vehicles")
    .insert([vehicleData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.update = async (vehicleId, updates) => {
  if (!db) {
    throw new Error("Supabase connection is required to update vehicles.");
  }

  const { data, error } = await db
    .from("vehicles")
    .update(updates)
    .eq("id", vehicleId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
