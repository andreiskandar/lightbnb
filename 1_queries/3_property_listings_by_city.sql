SELECT properties.id, properties.title, properties.cost_per_night, avg(property_reviews.rating) as average_rating
FROM properties
JOIN property_reviews ON property_reviews.property_id = properties.id
WHERE properties.city LIKE '%Vancouver'
GROUP BY properties.id
HAVING avg(property_reviews.rating) >= 4
-- ORDER BY avg(property_reviews.rating)
ORDER BY cost_per_night
LIMIT 10;

-- SELECT avg(rating)
-- FROM property_reviews

-- SELECT properties.id, title, cost_per_night, avg(property_reviews.rating) as average_rating
-- FROM properties
-- JOIN property_reviews ON properties.id = property_reviews.property_id
-- WHERE city LIKE '%ancouv%'
-- GROUP BY properties.id
-- HAVING avg(property_reviews.rating) >= 4
-- ORDER BY cost_per_night
-- LIMIT 10;