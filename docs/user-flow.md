# HopIn User Flow

This version avoids a big driver dashboard and keeps the app easier to understand.

## Main idea

Every user can become a rider, a driver, or both.

The app has two different request flows:

1. A driver posts a ride.
2. A rider requests a seat in that existing ride.

And:

1. A rider posts a new request saying they need a ride from point A to point B.
2. A driver sees that request and can accept it.

## Pages we need

- Landing page
- Find rides page
- My requests page
- My rides page
- Profile settings page

`Post a Ride` and `Request a Ride` now live inside `My Rides`, based on whether the user is in driver view or rider view.

## Find rides page

The main job of this page is to help users discover available rides and open a ride details screen.

## Flow 1: Driver posts a ride

1. Driver opens `My Rides`
2. Driver switches to `Driver View`
3. Driver opens `Post a Ride`
4. Driver enters:
   - origin
   - destination
   - date
   - time
   - seats
   - notes
5. Data is saved in the `rides` table
6. Riders can now see this ride in `Find Rides`

## Flow 2: Rider books an existing ride

1. Rider opens `Find Rides`
2. Rider sees driver rides
3. Rider opens one ride
4. Rider sends a booking request
5. Data is saved in `booking_requests`
6. Driver sees that request in the requests page
7. Driver can accept, decline, or ignore

## Flow 3: Rider posts a new ride request

1. Rider opens `My Rides`
2. Rider switches to `Rider View`
3. Rider opens `Request a Ride`
4. Rider enters:
   - origin
   - destination
   - date
   - time
   - seats needed
   - notes
5. Data is saved in `open_ride_requests`
6. Drivers can browse those requests
7. A driver can accept the request
8. If a driver ignores it, nothing is changed in the database and other drivers can still see it

## Messaging rule

Users should only be able to message each other after a request is accepted.

That means:

- if a driver accepts a booking request, chat opens for those two users
- if a driver accepts an open ride request, chat opens for those two users
- before acceptance, no chat should happen

## What drivers should see

Instead of a full dashboard, drivers only need one simple page:

- `My Requests`

That page should show:

- requests to join rides they posted
- open rider requests posted by riders

This is the cleanest way to keep the app simple while still supporting both types of requests.

## My Requests page

At the top of `My Requests`, the user should choose:

- `Rider View`
- `Driver View`

This is better than a dashboard because the same user can be both a rider and a driver.

### Rider View on My Requests

Show:

- `Requests I Sent for Existing Rides`
- `My Open Ride Requests`

### Driver View on My Requests

Show:

- `Requests on My Posted Rides`
- `Open Rider Requests`

This is how the driver clearly understands the difference between:

- requests on their own posted rides
- fresh ride requests created by riders

## My Rides page

`My Rides` should show accepted or active ride activity, and it also holds the main ride creation actions.

### Rider View on My Rides

Show:

- `Request a Ride` button
- `Upcoming Rides`
- `Completed Rides`
- `Cancelled Rides`

When:

- a booking request gets accepted
- or an open ride request gets accepted by a driver

that item should move into `My Rides`.

### Driver View on My Rides

Show:

- `Post a Ride` button
- `Upcoming Posted Rides`
- `Accepted Rider Requests`
- `Completed Rides`

## Important rule for "ignore"

- For booking requests on a driver's own ride, `ignore` can be treated like a status because only that driver sees the request.
- For rider-posted open ride requests, `ignore` should just mean "do nothing".
- We should not save a global `ignored` status for open ride requests, because that would hide the rider's request from other drivers too.

## Why this is a good solution

- Easy to understand
- Easy to code with MVC
- No heavy dashboard needed
- Clear separation between two request types
- Clear separation between `My Requests` and `My Rides`
- Better database design
- Simpler backend logic
