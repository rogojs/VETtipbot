const path = require('path');
require('dotenv').config({ path: path.resolve('../../.env') });

module.exports = {
  development: {
    username: 'api-tipbot',
    password: process.env.DEV_DB_PASSWORD,
    database: 'dev_tipbot',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
  test: {
    username: 'api-tipbot',
    password: process.env.TEST_DB_PASSWORD,
    database: 'test_tipbot',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
  production: {
    username: 'api-tipbot',
    password: process.env.PROD_DB_PASSWORD,
    database: 'prod_tipbot',
    host: '127.0.0.1',
    dialect: 'postgres',
    logging: false
  },
};
