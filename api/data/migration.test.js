require('dotenv').config();
const { expect } = require('chai');
const { Platform, Customer, Address } = require('./models');

describe('Database', () => {

  after(() => {
    Platform.sequelize.close();
  });

  describe('Platform', () => {
    it('has 7 social media sites available', (done) => {
      Platform
        .findAll()
        .then((results) => {
          expect(results).to.have.lengthOf(6);
          done();
        });
    });
  });

  describe('Customer', () => {
    it('must be created with a platform', (done) => {

      let newCustomer = Customer.build({
        username: 'a_wild_user'
      });

      newCustomer
        .save()
        .catch((error) => {
          expect(error).to.exist;
          done();
        });
    });

    it('must be unique on a platform', (done) => {

      let randomSeed = new Date().getMilliseconds();

      let newCustomer = Customer.build({
        username: 'a_wild_user_' + randomSeed,
        platformId: 1
      });

      newCustomer
        .save()
        .then((instance) => {
          expect(instance.id).to.be.gte(0);

          let duplicateCustomer = Customer.build({
            username: 'a_wild_user_' + randomSeed,
            platformId: 1
          });

          duplicateCustomer
            .save()
            .catch((error) => {
              expect(error).to.exist;
              done();
            });
        });
    });

    it('must have platform as a relationship', (done) => {
      let randomSeed = new Date().getMilliseconds();

      let newCustomer = Customer.build({
        username: 'a_wild_user_' + randomSeed,
        platformId: 1
      });

      newCustomer
        .save()
        .then((instance) => {
          expect(instance.id).to.be.gte(0);
          Customer
            .findAll({
              include: [
                {
                  model: Platform,
                  as: 'platform'
                }
              ],
              where: {
                username: 'a_wild_user_' + randomSeed
              }
            })
            .then((results) => {
              expect(results.length).to.eq(1);
              expect(results[0].platform.name).to.exist;
              done();
            });
        });
    });
  });

  describe('Address', () => {
    it('must be created with a customer', (done) => {
      let newAddress = Address.build({
        name: '_default',
        privateKey: 'barf',
        publicKey: 'barbarf',
        address: 'calonis'
      });

      newAddress
        .save()
        .catch((error) => {
          expect(error).to.exist;
          done();
        });
    });

    it('must have a unique name', (done) => {
      let randomSeed = new Date().getMilliseconds();

      let newCustomer = Customer.build({
        username: 'a_wild_user_' + randomSeed,
        platformId: 1
      });

      newCustomer
        .save()
        .then((instance) => {
          expect(instance.id).to.be.gte(0);

          let newAddress = Address.build({
            name: '_default',
            privateKey: 'barf',
            publicKey: 'barbarf',
            address: 'calonis',
            customerId: instance.id
          });

          newAddress
            .save()
            .then((instance) => {
              expect(instance).to.exist;

              let duplicateAddress = Address.build({
                name: '_default',
                privateKey: 'barf',
                publicKey: 'barbarf',
                address: 'calonis',
                customerId: newCustomer.id
              });

              duplicateAddress
                .save()
                .catch((error) => {
                  expect(error).to.exist;
                  done();
                });
            });
        });
    });

    it('must have customer as a relationship', (done) => {
      let randomSeed = new Date().getMilliseconds();

      let newCustomer = Customer.build({
        username: 'a_wild_user_' + randomSeed,
        platformId: 1
      });

      newCustomer
        .save()
        .then((customerInstance) => {
          expect(customerInstance.id).to.be.gte(0);

          let newAddress = Address.build({
            name: '_default',
            privateKey: 'barf',
            publicKey: 'barbarf',
            address: 'calonis',
            customerId: customerInstance.id
          });

          newAddress
            .save()
            .then((addressInstance) => {
              expect(addressInstance).to.exist;

              Address
                .findAll({
                  where: { name: "_default", customerId: customerInstance.id },
                  include: [{
                    model: Customer,
                    as: 'customer'
                  }]
                })
                .then((results) => {
                  expect(results).to.have.lengthOf(1);
                  expect(results[0].customer.username).to.eq('a_wild_user_' + randomSeed);
                  done();
                });
            });
        });
    });
  });
});