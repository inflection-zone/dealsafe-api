'use strict';

const schema = require(__dirname + '/../models/ContractDispute').Schema;
const tableName = require(__dirname + '/../models/ContractDispute').TableName;

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(tableName, schema);
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName);
    }
};