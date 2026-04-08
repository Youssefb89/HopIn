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
