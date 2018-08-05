require('dotenv').config();
const { Platform, Customer } = require('./data/models');

function createCustomer(platform, username) {
  if (platform === null && platform.id === null) {
    throw new Error('Platform is null or id not found');
  }

  const newCustomer = Customer.build({
    username,
    platformId: platform.id,
  });

  return newCustomer.save();
}

function handleError(error) {
  return new Promise((resolve) => {
    if (error) {
      // TODO: Replace with proper logging
      const details = error.errors.map(item => item.message).join(',');
      console.log(`api errors: [${details}]`);
    }
    resolve();
  });
}

function Api(options) {
  const defaultOptions = {
    usingDefault: true,
  };
  this.options = options || defaultOptions;

  Api.prototype.registerCustomer = function registerCustomer(source, username) {
    Platform
      .findAll({
        name: source,
      })
      .then(results => createCustomer(results[0], username))
      .catch(error => handleError(error))
      .finally(() => Platform.sequelize.close());
  };
}

module.exports.Api = Api;
