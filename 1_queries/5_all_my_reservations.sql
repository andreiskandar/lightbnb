
SELECT rvw.reservation_id as id,
ppt.title as title,
ppt.cost_per_night as cost_per_night,
rsv.start_date as start_date, 
avg(rvw.rating) as average_rating
FROM property_reviews rvw
JOIN properties ppt ON ppt.id = rsv.property_id
JOIN reservations rsv ON rvw.reservation_id = rsv.id
JOIN users ON users.id = rvw.guest_id
WHERE users.id = 1
ORDER BY rsv.start_date;
-- GROUP BY rsv.id, ppt.title, ppt.cost_per_night;