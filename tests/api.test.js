/* global describe it after */
const { expect } = require('chai');
const { Api } = require('../api');
const { Platform } = require('../api/data/models');

const api = new Api({ network: 'http://localhost:8669' });

describe('api', () => {
  after(() => {
    Platform.sequelize.close();
  });

  it('can register customers', (done) => {
    const randomSeed = Math.floor(Math.random() * 256);
    api
      .registerCustomer('reddit', `somerando_${randomSeed}`)
      .then(() => {
        done();
      });
  });

  it('can tip between strangers', (done) => {
    const randomSeedOne = Math.floor(Math.random() * 256);
    const randomSeedTwo = Math.floor(Math.random() * 256);
    api
      .sendvtho('reddit', `somerando_${randomSeedOne}`, `somerando_${randomSeedTwo}`, 1)
      .then(() => {
        done();
      });
  });
});
