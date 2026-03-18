const ratingService = require("../services/ratingService");

exports.createRating = async (req, res, next) => {
  try {
    const rating = await ratingService.createRating(req.body);

    res.status(201).json({
      success: true,
      data: rating
    });
  } catch (error) {
    next(error);
  }
};

exports.getRatingsForUser = async (req, res, next) => {
  try {
    const ratings = await ratingService.getRatingsForUser(req.params.userId);

    res.json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (error) {
    next(error);
  }
};

