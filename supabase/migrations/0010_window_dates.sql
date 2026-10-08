-- Multi-day pickup: each window carries its own date. The drop's pickup_date
-- becomes the earliest window date (kept in sync by the app on save).
alter table pickup_windows add column pickup_date date;
update pickup_windows w set pickup_date = d.pickup_date from drops d where w.drop_id = d.id;
alter table pickup_windows alter column pickup_date set not null;
