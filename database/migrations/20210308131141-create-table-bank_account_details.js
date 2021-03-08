'use strict';

const schema = require(__dirname + '/../models/BankAccountDetails').Schema;
const tableName = require(__dirname + '/../models/BankAccountDetails').TableName;

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(tableName, schema);
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName);
    }
};