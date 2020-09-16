SELECT ppt.city as city, count(rsv.*) as total_reservation
FROM properties ppt
JOIN reservations rsv ON ppt.id = rsv.property_id
GROUP BY ppt.city
ORDER BY total_reservation DESC;