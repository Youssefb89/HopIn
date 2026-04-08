const path = require("path");

const pagesDir = path.join(__dirname, "..", "..", "public", "pages");

function sendPage(res, fileName) {
  return res.sendFile(path.join(pagesDir, fileName));
}

exports.getLandingPage = (req, res) => sendPage(res, "index.html");
exports.getFindRidePage = (req, res) => sendPage(res, "find-ride.html");
exports.getPostRidePage = (req, res) =>
  res.redirect("/my-rides?view=driver&action=post");
exports.getMyRequestsPage = (req, res) => sendPage(res, "my-requests.html");
exports.getMyRidesPage = (req, res) => sendPage(res, "my-rides.html");
exports.getRideDetailsPage = (req, res) => sendPage(res, "ride-details.html");
exports.getProfileSettingsPage = (req, res) =>
  sendPage(res, "profile-settings.html");
exports.getVehicleSettingsPage = (req, res) =>
  res.redirect("/profile-settings?tab=vehicle");
exports.getMessagesPage = (req, res) => sendPage(res, "messages.html");
exports.getLoginPage = (req, res) => sendPage(res, "login.html");
exports.getSignupPage = (req, res) => sendPage(res, "signup.html");
