const express = require("express");
const path = require("path");

const pageRoutes = require("./routes/pageRoutes");
const userRoutes = require("./routes/userRoutes");
const rideRoutes = require("./routes/rideRoutes");
const rideRequestRoutes = require("./routes/rideRequestRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const reportRoutes = require("./routes/reportRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const messageRoutes = require("./routes/messageRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/assets", express.static(path.join(__dirname, "..", "public", "assets")));
app.use("/components", express.static(path.join(__dirname, "..", "public", "components")));
app.use("/Logo", express.static(path.join(__dirname, "..", "..", "Logo")));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    app: "HopIn",
    status: "ok"
  });
});

app.use(pageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api", rideRequestRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/auth", authRoutes);

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Something went wrong."
  });
});

module.exports = app;
