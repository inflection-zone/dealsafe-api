'use strict';

const schema = require(__dirname + '/../models/NotificationType').Schema;
const tableName = require(__dirname + '/../models/NotificationType').TableName;

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(tableName, schema);
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName);
    }
};