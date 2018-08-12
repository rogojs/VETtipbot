'use strict';
module.exports = (sequelize, DataTypes) => {
  var Address = sequelize.define('Address', {
    name: DataTypes.STRING,
    privateKey: DataTypes.STRING,
    publicKey: DataTypes.STRING,
    address: DataTypes.STRING,
    mnemonicPhrase: DataTypes.STRING,
    customerId: DataTypes.INTEGER
  }, {});
  Address.associate = function(models) {
    models.Address.belongsTo(models.Customer,{
      foreignKey: "customerId",
      as: "customer",
    });
  };
  return Address;
};