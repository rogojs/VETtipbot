'use strict';
module.exports = (sequelize, DataTypes) => {
  var Customer = sequelize.define('Customer', {
    username: DataTypes.STRING,
    platformId: DataTypes.INTEGER
  }, {});
  Customer.associate = function(models) {
    models.Customer.belongsTo(models.Platform,{
      foreignKey: "platformId",
      as: "platform",
    });
    models.Customer.hasMany(models.Address);
  };
  return Customer;
};