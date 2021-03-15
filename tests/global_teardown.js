const server = require('../index').server;
const sequelize = require('sequelize');
const db = require("../database/connection");

module.exports = async () => {
    await db.sequelize.close();
    server.close();
};