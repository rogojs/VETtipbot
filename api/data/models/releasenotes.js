'use strict';
module.exports = (sequelize, DataTypes) => {
  var ReleaseNotes = sequelize.define('ReleaseNotes', {
    version: DataTypes.STRING,
    notes: DataTypes.STRING
  }, {});
  ReleaseNotes.associate = function(models) {
    // associations can be defined here
  };
  return ReleaseNotes;
};