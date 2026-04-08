const reportService = require("../services/reportService");

exports.createReport = async (req, res, next) => {
  try {
    const report = await reportService.createReport(req.body);

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};
