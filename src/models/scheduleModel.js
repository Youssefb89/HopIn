const db = require("../config/db");

let mockSchedules = [];

exports.create = async (scheduleData) => {
  if (!db) {
    throw new Error("Supabase connection is required to create schedules.");
  }

  const { data, error } = await db
    .from("schedules")
    .insert([scheduleData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.getByUserId = async (userId) => {
  if (!db) {
    return mockSchedules.filter((item) => item.user_id === userId);
  }

  const { data, error } = await db
    .from("schedules")
    .select("*")
    .eq("user_id", userId)
    .order("day_of_week");

  if (error) {
    throw error;
  }

  return data || [];
};

exports.update = async (scheduleId, updates) => {
  if (!db) {
    throw new Error("Supabase connection is required to update schedules.");
  }

  const { data, error } = await db
    .from("schedules")
    .update(updates)
    .eq("id", scheduleId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.remove = async (scheduleId) => {
  if (!db) {
    throw new Error("Supabase connection is required to delete schedules.");
  }

  const { error } = await db.from("schedules").delete().eq("id", scheduleId);

  if (error) {
    throw error;
  }

  return { id: scheduleId, deleted: true };
};
