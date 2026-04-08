alter table rides
drop constraint if exists rides_seats_available_check;

alter table rides
add constraint rides_seats_available_check
check (seats_available between 0 and 8);
