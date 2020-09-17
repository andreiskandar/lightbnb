SELECT reservations.property_id as id,
properties.title as title,
properties.cost_per_night as cost_per_night,
reservations.start_date as start_date,
avg(property_reviews.rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON property_reviews.property_id= properties.id
  WHERE reservations.guest_id=1
    AND reservations.end_date < now()
  GROUP BY reservations.property_id, properties.title, properties.cost_per_night, reservations.start_date
  ORDER BY reservations.start_date
  LIMIT 10;






