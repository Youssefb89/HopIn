# Backend Setup Guide

This is the simple setup guide I would follow on a fresh machine.

## 1. Go into the project

```powershell
cd C:\Users\Rutva\Downloads\HopIn\Project-App
```

## 2. Install packages

Use `npm.cmd` on this machine:

```powershell
npm.cmd install
```

## 3. Create `.env`

Create this file in the project root:

```env
PORT=3000
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

This project is using the Supabase anon key only.

## 4. Run the schema

Open Supabase SQL Editor and run:

- `supabase/schema.sql`

If your tables were already created before the return commute time was added, also run:

- `supabase/add-schedule-return-time.sql`

## 5. Disable RLS if needed

If RLS was auto-enabled, run:

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

## 6. Add sample profiles

Run:

- `supabase/seed.sql`

This adds the 8 profile rows.

Optional cleanup files:

- `supabase/clear-non-profile-data.sql`
- `supabase/remove-old-9th-user.sql`

## 7. Start the app

```powershell
npm.cmd run dev
```

Open:

- [http://localhost:3000](http://localhost:3000)

## 8. First things to test

### API

- `GET /api/users`
- `GET /api/rides`
- `GET /api/my-requests?userId=11111111-1111-4111-8111-111111111111&view=driver`
- `GET /api/my-rides?userId=66666666-6666-4666-8666-666666666666&view=rider`

### Pages

- `/`
- `/profile-settings`
- `/find-ride`
- `/my-requests`
- `/my-rides`

## 9. Real data you should add

At minimum, I suggest:

1. seed the 8 profiles
2. save at least 1 vehicle for each driver or `both` user
3. add a few rides
4. then test booking requests and accepted rides

## 10. Small Mermaid summary

```mermaid
flowchart TD
    A["Create Supabase project"] --> B["Add .env file"]
    B --> C["Run schema.sql"]
    C --> D["Disable RLS if needed"]
    D --> E["Run seed.sql"]
    E --> F["npm.cmd run dev"]
    F --> G["Open localhost:3000"]
```
