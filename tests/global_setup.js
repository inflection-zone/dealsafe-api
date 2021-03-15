const service_launcher = require('../index');
const path = require('path');
const logger = require('../common/logger');
const db = require("../database/connection");
const {
    Client
} = require('pg')
var process = require('process');

module.exports = async () => {
    try {
        await db_drop_n_create();
        await db.sequelize.authenticate();
        await migrate_database();

        await service_launcher.set_middlewares();
        await service_launcher.set_routes();
        await service_launcher.fireup_server();

        await sleep(10000);
        await warm_up();
    } catch (error) {
        logger.log_error('Problem in setting up the tests! -> ' + error.message);
    }
};

async function execute_query(client, query) {
    try {
        await client.query(query);
    } catch (error) {
        console.log('...');
    }
}

async function db_drop_n_create() {
    try {
        const client = new Client({
            user: 'postgres',
            host: 'localhost',
            password: 'root',
            port: 5432,
        });
        await client.connect();
        await execute_query(client, `DROP DATABASE IF EXISTS deal_safe_test`);
        await execute_query(client, `CREATE DATABASE deal_safe_test`);
        await client.end();
    } catch (error) {
        console.log(error.message);
    }
}

function sleep(miliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, miliseconds);
    });
}

async function migrate_database() {
    try {
        const execSync = require('child_process').execSync;
        var output = execSync('npx sequelize-cli db:migrate');
        console.log('Database migrated successfully!\n');
    } catch (error) {
        console.log(error.message);
    }
}

function warm_up() {

    return new Promise((resolve, reject) => {
        try {
            resolve(1);
        } catch (error) {
            reject(0);
        }
    })

}