const scheduleModel = require("../models/scheduleModel");

exports.createSchedule = async (scheduleData) => {
  const payload = {
    user_id: scheduleData.user_id,
    day_of_week: scheduleData.day_of_week,
    departure_time: scheduleData.departure_time,
    return_time: scheduleData.return_time || null,
    location: scheduleData.location,
    destination: scheduleData.destination
  };

  if (!payload.user_id || !payload.day_of_week || !payload.departure_time) {
    throw new Error("user_id, day_of_week, and departure_time are required.");
  }

  return scheduleModel.create(payload);
};

exports.getSchedulesByUser = async (userId) => {
  if (!userId) {
    throw new Error("userId is required.");
  }

  return scheduleModel.getByUserId(userId);
};

exports.updateSchedule = async (scheduleId, updates) => {
  if (!scheduleId) {
    throw new Error("Schedule id is required.");
  }

  return scheduleModel.update(scheduleId, updates);
};

exports.deleteSchedule = async (scheduleId) => {
  if (!scheduleId) {
    throw new Error("Schedule id is required.");
  }

  return scheduleModel.remove(scheduleId);
};
