alter table open_ride_requests
drop constraint if exists open_ride_requests_status_check;

alter table open_ride_requests
add constraint open_ride_requests_status_check
check (status in ('open', 'accepted', 'declined', 'cancelled', 'completed'));
