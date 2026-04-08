const authService = require("../services/authService");

exports.getPublicConfig = async (req, res, next) => {
  try {
    const config = await authService.getPublicConfig();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
};

exports.getLinkedProfile = async (req, res, next) => {
  try {
    const profile = await authService.getLinkedProfile(
      req.query.authUserId,
      req.query.email
    );

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

exports.linkProfile = async (req, res, next) => {
  try {
    const profile = await authService.linkProfile(
      req.body.profile_id,
      req.body.auth_user_id,
      req.body.email
    );

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

exports.syncProfileForAuth = async (req, res, next) => {
  try {
    const profile = await authService.syncProfileForAuth(req.body);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
