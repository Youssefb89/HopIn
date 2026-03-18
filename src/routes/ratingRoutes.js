const express = require("express");
const ratingController = require("../controllers/ratingController");

const router = express.Router();

router.post("/", ratingController.createRating);

module.exports = router;

