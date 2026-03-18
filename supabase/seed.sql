insert into profiles (id, auth_user_id, full_name, email, role, phone, home_area, commute_notes, rating_avg)
values
  ('11111111-1111-4111-8111-111111111111', null, 'Alex Thompson', 'alex@example.com', 'driver', '(306) 555-0101', 'Albert Park', 'Weekdays before 8 AM', 4.8),
  ('22222222-2222-4222-8222-222222222222', null, 'Priya Sharma', 'priya@example.com', 'driver', '(306) 555-0140', 'Normanview', 'Late morning commute', 4.9),
  ('33333333-3333-4333-8333-333333333333', null, 'Jordan Lee', 'jordan@example.com', 'driver', '(306) 555-0175', 'Harbour Landing', 'Afternoon campus runs', 4.5),
  ('44444444-4444-4444-8444-444444444444', null, 'Mohammed Al-Hassan', 'mohammed@example.com', 'driver', '(306) 555-0188', 'Lakeview', 'Mid afternoon commute', 5.0),
  ('66666666-6666-4666-8666-666666666666', null, 'Jamie Lee', 'jamie@example.com', 'rider', '(306) 555-0102', 'Downtown', 'Morning classes', 0.0),
  ('77777777-7777-4777-8777-777777777777', null, 'Sarah Kim', 'sarah@example.com', 'rider', '(306) 555-0103', 'Uplands', 'Flexible afternoons', 4.5),
  ('88888888-8888-4888-8888-888888888888', null, 'Taylor Brooks', 'taylor@example.com', 'rider', '(306) 555-0117', 'Harbour Landing', 'Morning labs', 4.6),
  ('99999999-9999-4999-8999-999999999999', null, 'Noah Patel', 'noah@example.com', 'rider', '(306) 555-0128', 'Whitmore Park', 'Afternoon classes', 4.4)
on conflict (id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  phone = excluded.phone,
  home_area = excluded.home_area,
  commute_notes = excluded.commute_notes,
  rating_avg = excluded.rating_avg,
  updated_at = now();
