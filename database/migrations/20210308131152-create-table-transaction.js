'use strict';

const schema = require(__dirname + '/../models/Transaction').Schema;
const tableName = require(__dirname + '/../models/Transaction').TableName;

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(tableName, schema);
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName);
    }
};