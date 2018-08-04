'use strict';
module.exports = (sequelize, DataTypes) => {
  var Platform = sequelize.define('Platform', {
    name: DataTypes.STRING
  }, {});
  Platform.associate = function(models) {
    models.Platform.hasMany(models.Customer,{foreignKey: 'platformId'});
  };
  return Platform;
};