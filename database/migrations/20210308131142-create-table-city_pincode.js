'use strict';

const schema = require(__dirname + '/../models/CityPincode').Schema;
const tableName = require(__dirname + '/../models/CityPincode').TableName;

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(tableName, schema);
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName);
    }
};