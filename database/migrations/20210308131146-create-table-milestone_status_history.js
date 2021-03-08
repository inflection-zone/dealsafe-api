'use strict';

const schema = require(__dirname + '/../models/MilestoneStatusHistory').Schema;
const tableName = require(__dirname + '/../models/MilestoneStatusHistory').TableName;

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(tableName, schema);
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName);
    }
};