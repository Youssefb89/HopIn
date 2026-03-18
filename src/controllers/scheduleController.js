const scheduleService = require("../services/scheduleService");

exports.createSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.createSchedule(req.body);

    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

exports.getSchedulesByUser = async (req, res, next) => {
  try {
    const schedules = await scheduleService.getSchedulesByUser(req.params.userId);

    res.json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.updateSchedule(
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSchedule = async (req, res, next) => {
  try {
    const result = await scheduleService.deleteSchedule(req.params.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

