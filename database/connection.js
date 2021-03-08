'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/db_config')[env];
const logger = require('../common/logger');

const db = {};

logger.log('Node environment: ' + process.env.NODE_ENV);
logger.log('database: ' + config.database);
logger.log('username: ' + config.username);
logger.log('host: ' + config.host);

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle
  },
  logging: false //TODO: Please provide a function here to handle logging...
});

db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;
