'use strict';

const schema = require(__dirname + '/../models/RolePrivilege').Schema;
const tableName = require(__dirname + '/../models/RolePrivilege').TableName;

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(tableName, schema);
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable(tableName);
    }
};