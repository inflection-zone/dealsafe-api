'use strict';

const schema = require(__dirname + '/../models/Role').Schema;
const tableName = require(__dirname + '/../models/Role').TableName;

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(tableName, schema);
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName);
    }
};