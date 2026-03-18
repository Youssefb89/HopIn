# Backend Setup Guide

This project is now using:

- Supabase URL
- Supabase anon key
- 8 sample profile rows only
- no fake ride or request seed data

## 1. Create `.env`

Inside `C:\Users\Rutva\Downloads\HopIn\Project-App`, create:

```env
PORT=3000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## 2. Run the schema

Run [schema.sql](C:\Users\Rutva\Downloads\HopIn\Project-App\supabase\schema.sql) in Supabase SQL Editor.

## 3. Disable RLS if it was auto-enabled

```sql
alter table profiles disable row level security;
alter table vehicles disable row level security;
alter table rides disable row level security;
alter table booking_requests disable row level security;
alter table open_ride_requests disable row level security;
alter table messages disable row level security;
alter table ratings disable row level security;
alter table schedules disable row level security;
```

## 4. Clear old sample ride/request data

If you already inserted old fake rides, requests, vehicles, or messages, run:

[clear-non-profile-data.sql](C:\Users\Rutva\Downloads\HopIn\Project-App\supabase\clear-non-profile-data.sql)

## 5. Seed only the 8 profile rows

Run:

[seed.sql](C:\Users\Rutva\Downloads\HopIn\Project-App\supabase\seed.sql)

This will create only the 8 editable sample users.

If you already ran an older 9-user seed once, also run:

[remove-old-9th-user.sql](C:\Users\Rutva\Downloads\HopIn\Project-App\supabase\remove-old-9th-user.sql)

## 6. Start the app

```powershell
cd C:\Users\Rutva\Downloads\HopIn\Project-App
npm.cmd run dev
```

## 7. Test these first

- `GET /api/users`
- `GET /api/users/11111111-1111-4111-8111-111111111111`
- `GET /api/rides`

Expected result now:

- `/api/users` should return 8 users
- `/api/rides` should return an empty array until you add real rides

## 8. Current learning flow

Right now the best flow is:

1. Switch users from the navbar dropdown
2. Edit profiles on the profile page
3. Save changes and confirm they persist in Supabase
4. Add rides and requests later when you are ready
