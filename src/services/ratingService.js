const ratingModel = require("../models/ratingModel");

exports.createRating = async (ratingData) => {
  const payload = {
    reviewer_id: ratingData.reviewer_id,
    reviewed_user_id: ratingData.reviewed_user_id,
    ride_id: ratingData.ride_id || null,
    booking_request_id: ratingData.booking_request_id || null,
    open_ride_request_id: ratingData.open_ride_request_id || null,
    score: Number(ratingData.score),
    comment: ratingData.comment || null
  };

  if (!payload.reviewer_id || !payload.reviewed_user_id || !payload.score) {
    throw new Error("reviewer_id, reviewed_user_id, and score are required.");
  }

  return ratingModel.create(payload);
};

exports.getRatingsForUser = async (userId) => {
  if (!userId) {
    throw new Error("userId is required.");
  }

  return ratingModel.getByUserId(userId);
};

