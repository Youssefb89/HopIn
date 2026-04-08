const reportModel = require("../models/reportModel");

exports.createReport = async (reportData) => {
  const payload = {
    reporter_id: reportData.reporter_id,
    reported_user_id: reportData.reported_user_id,
    ride_id: reportData.ride_id || null,
    booking_request_id: reportData.booking_request_id || null,
    open_ride_request_id: reportData.open_ride_request_id || null,
    reason: reportData.reason,
    details: reportData.details || null
  };

  if (!payload.reporter_id || !payload.reported_user_id || !payload.reason) {
    throw new Error("reporter_id, reported_user_id, and reason are required.");
  }

  return reportModel.create(payload);
};
