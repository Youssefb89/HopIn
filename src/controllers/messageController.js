const messageService = require("../services/messageService");

exports.createMessage = async (req, res, next) => {
  try {
    const message = await messageService.createMessage(req.body);

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const messages = await messageService.getMessages(req.query);

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

