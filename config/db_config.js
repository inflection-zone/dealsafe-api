const fs = require('fs');

//This will make sure that -
//1. Even when we are running migrate scripts from commandline, 
//   proper environment variables are loaded
//2. If condition will avoid ugly ('already exists') messages from dotenv

if (typeof process.env.NODE_ENV === 'undefined') {
    require('dotenv').config();
}

if (process.env.NODE_ENV == 'test') {
    require('dotenv').config();
    console.log('================================================');
    console.log('Environment: ' + process.env.NODE_ENV);
    console.log('Database: ' + process.env.DB_NAME);
    console.log('Database: ' + process.env.DB_USER_NAME);
    console.log('================================================');
}

module.exports = {
    development: {
        username: process.env.DB_USER_NAME,
        password: process.env.DB_USER_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'postgres',
        pool: {
            max: 20,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
    test: {
        username: process.env.DB_USER_NAME,
        password: process.env.DB_USER_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'postgres',
        pool: {
            max: 20,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
    production: {
        username: process.env.DB_USER_NAME,
        password: process.env.DB_USER_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'postgres',
        pool: {
            max: 20,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
}