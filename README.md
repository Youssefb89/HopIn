# HopIn

HopIn is our ride-sharing project.  
This version is built with simple HTML, CSS, JavaScript, Bootstrap, jQuery, Node.js, Express.js, and Supabase.

We kept the code and docs beginner-friendly on purpose, so it is easier to learn how the project works page by page.

## What this project can do right now

- switch between sample users from the navbar
- edit profile details
- save vehicle details
- post a ride
- request a ride
- find rides
- open ride details
- send a booking request on an existing ride
- accept or decline ride requests
- show accepted rides in `My Rides`

`Messages` is still not explained in the docs on purpose because that part is not the focus yet.

## Tech stack

- Frontend: HTML, CSS, Bootstrap, jQuery
- Backend: Node.js, Express.js
- Database: Supabase
- Pattern: simple MVC

## Project folder

The real app is inside the `Project-App` folder.

If someone clones only this app repo, they can place it anywhere on their machine.

The older prototype files in the parent `HopIn` folder were only used here as visual reference while building.

## Before you run the project

You should have:

- Node.js installed
- npm installed
- a Supabase project created

## Step-by-step setup

### 1. Clone or open the project folder

If you already have the folder, just open it in terminal.

If you are cloning from GitHub:

```powershell
git clone <your-repo-url>
cd Project-App
```

If you already have the code locally:

```powershell
cd Project-App
```

### 2. Install packages

On this machine, PowerShell can block `npm.ps1`, so use `npm.cmd`.

```powershell
npm.cmd install
```

### 3. Create `.env`

Create a file named `.env` in the project root.

Use this:

```env
PORT=3000
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

This project is using only:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 4. Run the database SQL

Open Supabase SQL Editor and run:

- `supabase/schema.sql`

If your schema was already created before the extra commute return time was added, also run:

- `supabase/add-schedule-return-time.sql`

## 5. Disable RLS for now

If Supabase auto-enabled Row Level Security, run this too:

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

## 6. Add sample users

Run:

- `supabase/seed.sql`

This adds the 8 profile rows used by the app.

If you had older test data before, you can also use:

- `supabase/clear-non-profile-data.sql`
- `supabase/remove-old-9th-user.sql`

## 7. Start the project

```powershell
npm.cmd run dev
```

Then open:

- [http://localhost:3000](http://localhost:3000)

## 8. Recommended testing order

This is the order I would personally test:

1. switch users from the navbar
2. update profile page
3. update vehicle page
4. add a few rides
5. test `Find Ride`
6. open ride details
7. request an existing ride
8. accept the request as the driver
9. check `My Requests`
10. check `My Rides`

## Important note for posting rides

Before a driver can properly post a ride, that user should have a vehicle saved first in:

- `Profile -> My Vehicle`

Without a vehicle, the app now shows a warning instead of posting silently.

## Important note for roles

The app now respects profile role in many places:

- `rider` can only use rider pages/actions
- `driver` can only use driver pages/actions
- `both` can use both

## Main pages

- `/`
- `/find-ride`
- `/ride-details`
- `/my-requests`
- `/my-rides`
- `/profile-settings`
- `/messages`

## Main database tables

- `profiles`
- `vehicles`
- `rides`
- `booking_requests`
- `open_ride_requests`
- `ratings`
- `schedules`
- `messages`

## Docs to read next

Start here:

- [docs/README.md](./docs/README.md)

Best docs for learning the project:

- [docs/profile-page/README.md](./docs/profile-page/README.md)
- [docs/home-find-rides/README.md](./docs/home-find-rides/README.md)
- [docs/my-requests/README.md](./docs/my-requests/README.md)
- [docs/my-rides/README.md](./docs/my-rides/README.md)
- [docs/database-schema.md](./docs/database-schema.md)

## Small note

I wrote these docs in a simple style on purpose.  
The idea is not to sound too formal.  
The idea is to make the project easier to understand while learning.
