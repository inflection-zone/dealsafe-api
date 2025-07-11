'use strict';

const schema = require(__dirname + '/../models/Contract').Schema;
const tableName = require(__dirname + '/../models/Contract').TableName;

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(tableName, schema);
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName);
    }
};