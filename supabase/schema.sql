create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text not null,
  email text unique,
  role text not null default 'rider' check (role in ('rider', 'driver', 'both')),
  phone text,
  home_area text,
  commute_notes text,
  rating_avg numeric(2, 1) not null default 0.0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  make text not null,
  model text not null,
  vehicle_year integer,
  color text,
  license_plate text,
  seats_available integer not null default 1 check (seats_available between 1 and 8),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references profiles (id) on delete cascade,
  vehicle_id uuid references vehicles (id) on delete set null,
  origin text not null,
  destination text not null,
  ride_date date not null,
  ride_time time not null,
  seats_available integer not null default 1 check (seats_available between 0 and 8),
  notes text,
  status text not null default 'open' check (status in ('open', 'full', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists booking_requests (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references rides (id) on delete cascade,
  rider_id uuid not null references profiles (id) on delete cascade,
  seats_requested integer not null default 1 check (seats_requested > 0),
  message text,
  pickup_otp text,
  status text not null default 'requested' check (status in ('requested', 'accepted', 'declined', 'ignored', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ride_id, rider_id)
);

create table if not exists open_ride_requests (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references profiles (id) on delete cascade,
  accepted_driver_id uuid references profiles (id) on delete set null,
  origin text not null,
  destination text not null,
  ride_date date not null,
  ride_time time not null,
  seats_needed integer not null default 1 check (seats_needed > 0),
  notes text,
  status text not null default 'open' check (status in ('open', 'accepted', 'declined', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references profiles (id) on delete cascade,
  reviewed_user_id uuid not null references profiles (id) on delete cascade,
  ride_id uuid references rides (id) on delete set null,
  booking_request_id uuid references booking_requests (id) on delete set null,
  open_ride_request_id uuid references open_ride_requests (id) on delete set null,
  score integer not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  reported_user_id uuid not null references profiles (id) on delete cascade,
  ride_id uuid references rides (id) on delete set null,
  booking_request_id uuid references booking_requests (id) on delete set null,
  open_ride_request_id uuid references open_ride_requests (id) on delete set null,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  day_of_week text not null,
  departure_time time not null,
  return_time time,
  location text,
  destination text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles (id) on delete cascade,
  receiver_id uuid not null references profiles (id) on delete cascade,
  booking_request_id uuid references booking_requests (id) on delete cascade,
  open_ride_request_id uuid references open_ride_requests (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  check (
    booking_request_id is not null
    or open_ride_request_id is not null
  )
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
before update on profiles
for each row
execute function set_updated_at();

drop trigger if exists trg_vehicles_updated_at on vehicles;
create trigger trg_vehicles_updated_at
before update on vehicles
for each row
execute function set_updated_at();

drop trigger if exists trg_rides_updated_at on rides;
create trigger trg_rides_updated_at
before update on rides
for each row
execute function set_updated_at();

drop trigger if exists trg_booking_requests_updated_at on booking_requests;
create trigger trg_booking_requests_updated_at
before update on booking_requests
for each row
execute function set_updated_at();

drop trigger if exists trg_open_ride_requests_updated_at on open_ride_requests;
create trigger trg_open_ride_requests_updated_at
before update on open_ride_requests
for each row
execute function set_updated_at();

drop trigger if exists trg_schedules_updated_at on schedules;
create trigger trg_schedules_updated_at
before update on schedules
for each row
execute function set_updated_at();
