# HopIn Database Schema

## Main tables

- `profiles`
- `vehicles`
- `rides`
- `booking_requests`
- `open_ride_requests`
- `ratings`
- `schedules`
- `messages`

## Diagram

```mermaid
erDiagram
    PROFILES ||--o{ VEHICLES : owns
    PROFILES ||--o{ RIDES : posts
    PROFILES ||--o{ BOOKING_REQUESTS : sends
    PROFILES ||--o{ OPEN_RIDE_REQUESTS : creates
    PROFILES ||--o{ SCHEDULES : has
    PROFILES ||--o{ RATINGS : reviews
    PROFILES ||--o{ MESSAGES : sends
    VEHICLES ||--o{ RIDES : used_for
    RIDES ||--o{ BOOKING_REQUESTS : receives
    RIDES ||--o{ RATINGS : linked_to
    BOOKING_REQUESTS ||--o{ MESSAGES : unlocks_chat
    OPEN_RIDE_REQUESTS ||--o{ MESSAGES : unlocks_chat

    PROFILES {
        uuid id PK
        uuid auth_user_id
        text full_name
        text email
        text role
        text phone
        text home_area
        text commute_notes
        numeric rating_avg
    }

    VEHICLES {
        uuid id PK
        uuid user_id FK
        text make
        text model
        int vehicle_year
        text color
        text license_plate
        int seats_available
    }

    RIDES {
        uuid id PK
        uuid driver_id FK
        uuid vehicle_id FK
        text origin
        text destination
        date ride_date
        time ride_time
        int seats_available
        text status
    }

    BOOKING_REQUESTS {
        uuid id PK
        uuid ride_id FK
        uuid rider_id FK
        int seats_requested
        text message
        text pickup_otp
        text status
    }

    OPEN_RIDE_REQUESTS {
        uuid id PK
        uuid rider_id FK
        uuid accepted_driver_id FK
        text origin
        text destination
        date ride_date
        time ride_time
        int seats_needed
        text notes
        text status
    }

    RATINGS {
        uuid id PK
        uuid reviewer_id FK
        uuid reviewed_user_id FK
        uuid ride_id FK
        int score
        text comment
    }

    SCHEDULES {
        uuid id PK
        uuid user_id FK
        text day_of_week
        time departure_time
        text location
        text destination
    }

    MESSAGES {
        uuid id PK
        uuid sender_id FK
        uuid receiver_id FK
        uuid booking_request_id FK
        uuid open_ride_request_id FK
        text content
    }
```

## Important note about messages

Messages are not open by default.

A chat is only allowed when one of these becomes accepted:

- a `booking_request`
- an `open_ride_request`

That is why messages link to a request instead of only linking to a ride.
