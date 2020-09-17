require('dotenv').config();
const properties = require('./json/properties.json');
const users = require('./json/users.json');

const pg = require('pg');
const Client = pg.Client;

const config = {
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
};

const client = new Client(config);

client.connect(() => console.log('connected to db'));
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const queryString = 'SELECT * FROM users WHERE email=$1;';
  return client.query(queryString, [email]).then((res) => res.rows[0]);
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const queryString = 'SELECT * from users WHERE id=$1;';
  return client.query(queryString, [id]).then((res) => res.rows);
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const queryString = `INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3) RETURNING *;`;
  const newUserInfo = [];
  for (const elem in user) {
    newUserInfo.push(user[elem]);
  }
  return client.query(queryString, newUserInfo).then((res) => res.rows);
  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  // const queryString = 'SELECT * FROM reservations WHERE guest_id=$1 LIMIT $2;';
  const queryString = `
    SELECT reservations.property_id as id,
    properties.*,
    properties.id,
    reservations.start_date as start_date,
    reservations.end_date as end_date,
    avg(property_reviews.rating) as average_rating
      FROM reservations
      JOIN properties ON reservations.property_id = properties.id
      JOIN property_reviews ON property_reviews.property_id= properties.id
      WHERE reservations.guest_id=$1
        AND reservations.end_date < now()
      GROUP BY properties.id, reservations.property_id, reservations.start_date, reservations.end_date
      ORDER BY reservations.start_date
      LIMIT $2;
  `;

  return client.query(queryString, [guest_id, limit]).then((res) => res.rows);
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  let queryString = `
  SELECT properties.id, properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  LEFT JOIN property_reviews ON property_reviews.property_id = properties.id
  `;

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `WHERE owner_id=$${queryParams.length} `;
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE properties.city LIKE $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += `AND properties.cost_per_night >= $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `AND properties.cost_per_night <= $${queryParams.length} `;
  }

  queryString += `GROUP BY properties.id `;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};`;

  console.log('queryString:', queryString);
  // console.log('queryParams:', queryParams);

  // const queryString = `SELECT * FROM properties LIMIT $1;`;
  return client.query(queryString, queryParams).then((res) => res.rows);
  // const limitedProperties = {};
  // for (let i = 1; i <= limit; i++) {
  //   limitedProperties[i] = properties[i];
  // }
  // return Promise.resolve(limitedProperties);
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  // { title: 'Edm',
  // description: 'Corner Unit',
  // number_of_bedrooms: '2',
  // number_of_bathrooms: '2',
  // parking_spaces: '1',
  // cost_per_night: '150',
  // thumbnail_photo_url: 'thumbnail url',
  // cover_photo_url: 'cover url',
  // street: '7088',
  // country: 'CA',
  // city: 'vancouver',
  // province: 'BC',
  // post_code: 'V7S J02',
  // owner_id: 1004 }

  // let attributeString = '';
  // let dollarString = '';
  // const valueString = [];
  // let count = 1;
  // for (const key in property) {
  //   if (key === 'owner_id') {
  //     attributeString += key;
  //     dollarString += `$${count++}`;
  //   } else {
  //     attributeString += key + ', ';
  //     dollarString += `$${count++}, `;
  //   }
  //   valueString.push(property[key]);
  // }

  // const queryString = `INSERT INTO properties (${attributeString}) VALUES (${dollarString}) RETURNING *;`;

  const attributeArray = Object.keys(property);
  const attributeString = attributeArray.join(', ');
  const valueArray = attributeArray.map((key) => {
    if (key === 'cost_per_night') {
      property[key] *= 100;
    }
    return property[key];
  });

  const dollarString = attributeArray.map((key, index) => `$${index + 1}`).join(', ');

  const queryString = `INSERT INTO properties (${attributeString}) VALUES (${dollarString}) RETURNING *;`;

  return client
    .query(queryString, valueArray)
    .then((res) => res.rows)
    .catch();
  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);
};
exports.addProperty = addProperty;
