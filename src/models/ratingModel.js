const db = require("../config/db");

let mockRatings = [];

exports.create = async (ratingData) => {
  if (!db) {
    const newRating = {
      id: `rating-${Date.now()}`,
      ...ratingData
    };

    mockRatings.push(newRating);
    return newRating;
  }

  const { data, error } = await db
    .from("ratings")
    .insert([ratingData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

exports.getByUserId = async (userId) => {
  if (!db) {
    return mockRatings.filter((item) => item.reviewed_user_id === userId);
  }

  const { data, error } = await db
    .from("ratings")
    .select("*")
    .eq("reviewed_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

exports.getAverageForUser = async (userId) => {
  const ratings = await exports.getByUserId(userId);

  if (!ratings.length) {
    return 0;
  }

  const total = ratings.reduce((sum, item) => sum + Number(item.score || 0), 0);
  return Number((total / ratings.length).toFixed(1));
};
