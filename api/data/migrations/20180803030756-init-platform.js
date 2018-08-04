'use strict';
const { Op } = require('sequelize');

const names = ['reddit', 'twitter', 'telegram', 'facebook', 'whatsapp', 'wechat'];

module.exports = {
  up: (queryInterface, Sequelize) => {
    const platforms = names.map((name) => { return { name: name, createdAt: new Date(), updatedAt: new Date() }; } );
    queryInterface.bulkInsert('Platforms', platforms);
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.bulkDelete('Platforms', {
      name: {
        [Op.in]: ['reddit', 'twitter', 'telegram', 'facebook', 'whatsapp', 'wechat']
      }
    });
  }
};
