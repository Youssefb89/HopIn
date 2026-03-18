# HopIn Project Structure

## Goal

Use a beginner-friendly backend structure close to your PDF architecture while still fitting HopIn's real product flow and Supabase.

## Backend structure

```text
/src
  /config
    db.js

  /controllers
    pageController.js
    userController.js
    rideController.js
    rideRequestController.js
    ratingController.js
    scheduleController.js
    messageController.js

  /services
    userService.js
    rideService.js
    rideRequestService.js
    ratingService.js
    scheduleService.js
    messageService.js

  /models
    userModel.js
    vehicleModel.js
    rideModel.js
    rideRequestModel.js
    ratingModel.js
    scheduleModel.js
    messageModel.js

  /routes
    pageRoutes.js
    userRoutes.js
    rideRoutes.js
    rideRequestRoutes.js
    ratingRoutes.js
    scheduleRoutes.js
    messageRoutes.js

  app.js
```

## Request flow

The backend uses two request types:

- `booking_requests`
  Rider requests a seat on an existing posted ride.

- `open_ride_requests`
  Rider posts a new request from point A to point B for drivers to accept.

## Important decisions

- We kept the `services` folder because you asked for it.
- We removed the middleware-based structure and kept error handling simple in `app.js`.
- We kept `schedules`, `ratings`, and `messages`.
- Messages are only allowed after a booking request or open ride request is accepted.
- We kept `vehicles` because it is core to the driver flow.

## Main API groups

- `/api/users`
- `/api/rides`
- `/api/ratings`
- `/api/schedules`
- `/api/messages`
- `/api/my-requests`
- `/api/my-rides`
- `/api/open-ride-requests`
- `/api/rides/:rideId/booking-requests`

## Frontend pages

- `/`
- `/find-ride`
- `/my-requests`
- `/my-rides`
- `/profile-settings`
- `/vehicle-settings`

