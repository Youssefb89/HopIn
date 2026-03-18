const express = require("express");
const scheduleController = require("../controllers/scheduleController");

const router = express.Router();

router.post("/", scheduleController.createSchedule);
router.get("/:userId", scheduleController.getSchedulesByUser);
router.put("/:id", scheduleController.updateSchedule);
router.delete("/:id", scheduleController.deleteSchedule);

module.exports = router;

