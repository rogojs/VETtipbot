'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Addresses', 'mnemonicPhrase', { type: Sequelize.DataTypes.STRING, allowNull: false, defaultValue: '' });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Addresses', 'mnemonicPhrase');
  }
};
