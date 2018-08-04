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
              include:[
                {
                  model: Platform,
                  as: 'platform'
                }
              ],
              where: {
                username: 'a_wild_user_' + randomSeed
              }
            })
            .then((results)=>{
              expect(results.length).to.eq(1);
              expect(results[0].platform.name).to.exist;
              done();
            });
        });
    });
  });

});



// Platform
//   .findAll()
//   .then((platforms) => {

//     if (platforms) {
//       platforms.forEach((platform) => {
//         console.log(platform.name);
//       });
//     }

//   });

// Platform
//   .findAll({
//     where: {
//       name: "reddit"
//     }
//   })
//   .then((platforms) => { 
//     if(platforms && platforms.length === 1)
//     {
//       const newCustomer = 
//       Customer.build({
//         username: 'rogo',
//         platformId: platforms[0].id
//       });

//       newCustomer
//         .save()
//         .then((newCustomer)=>{
//           console.log('created a new customer')

//           const newAddress =
//           Address.build({
//             name: '_default',
//             publicKey: 'abcdef',
//             privateKey: 'ghijkl',
//             address: 'mnopqrstuvwxyz',
//             customerId: newCustomer.id
//           });

//           newAddress
//             .save()
//             .then(()=>{
//               console.log('address created!')
//             });

//             const newAddress2 =
//             Address.build({
//               name: '_default',
//               publicKey: 'abcdef',
//               privateKey: 'ghijkl',
//               address: 'mnopqrstuvwxyz',
//               customerId: newCustomer.id
//             });

//             newAddress2
//               .save()
//               .then(()=>{
//                 console.log('address created again!')
//                 Platform.sequelize.close();
//               });
//         })
//         .catch((error) =>{
//           console.log(error);
//         });
//     }
//   })