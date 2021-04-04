'use strict';
require('dotenv').config();
const express = require("express");
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const logger = require('./common/logger');
const scheduler = require("./common/job_scheduler");
const thirdparty_handler = require('./common/thirdparty_handler');
const seeder = require('./common/seeder');

//const cache_handler = require('./common/cache_handler');
const db = require("./database/connection");
const app = express();

async function setup_db() {
    try {
        await db.sequelize.authenticate();
        logger.log('Database connection has been established successfully.');
    } catch (error) {
        logger.log_error('Unable to connect to the database:' + error.message);
    }
}

exports.set_middlewares = () => {
    return new Promise((resolve, reject) => {
        try {
            app.set('trust proxy', true);

            const bodyParser = require("body-parser");
            app.use(bodyParser.json());
            app.use(bodyParser.urlencoded({
                extended: true
            }));
            app.use(express.json());
            app.use(helmet());

            //Add middleware for file uploads
            app.use(fileUpload({
                limits: {
                    fileSize: 25 * 1024 * 1024
                },
                preserveExtension: true,
                createParentPath: true,
                parseNested: true,
                useTempFiles: true,
                tempFileDir: '/tmp/uploads/'
            }));

            //CORS handling
            app.use(function(req, res, next) {
                if (req.headers.origin) {
                    res.setHeader(
                        "Access-Control-Allow-Origin",
                        process.env.domain || req.headers.origin
                    );
                }
                res.setHeader(
                    "Access-Control-Allow-Methods",
                    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
                );
                res.setHeader(
                    "Access-Control-Allow-Headers",
                    "Origin,Authorization,X-Requested-With,content-type,Accept,enc"
                );

                res.setHeader("Access-Control-Allow-Credentials", true);

                // if ("OPTIONS" === req.method) {
                //   return res.sendStatus(200);
                // }

                return next();
            });

            resolve(true);
        } catch (error) {
            reject(error);
        }
    });
}

function set_routes() {
    return new Promise((resolve, reject) => {
        try {
            require("./routes/address.routes")(app);
            require("./routes/agreement_clause.routes")(app);
            require("./routes/bank_account_details.routes")(app);
            require("./routes/company.routes")(app);
            require("./routes/contract.routes")(app);
            require("./routes/contract_dispute.routes")(app);
            require("./routes/contract_milestone.routes")(app);
            require("./routes/notification.routes")(app);
            require("./routes/payment_request.routes")(app);
            require("./routes/transaction.routes")(app);
            require("./routes/user.routes")(app);
            require("./routes/resource.routes")(app);
            require("./routes/types.routes")(app);


            //Set the base route
            app.get("/api/v1/", (req, res) => {
                res.send({
                    message: `DealSafe API [Service version - ${process.env.SERVICE_VERSION}]`
                });
            });
            resolve(true);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports.start_listening = () => {
    return new Promise((resolve, reject) => {
        try {
            const port = process.env.PORT;
            var server = app.listen(port, () => {
                var serviceName = 'DealSafe' + '-' + process.env.NODE_ENV;
                logger.log(serviceName + ' is up and listening on port ' + process.env.PORT.toString());
                app.emit("server_started");
            });
            module.exports.server = server;
            resolve(app);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports.fireup_server = async () => {
    await scheduler.schedule_cron_jobs();
    await thirdparty_handler.initialize_thirdparty_services();
    await seeder.seed();
    //await cache_service.refresh_cache();
    var app = await this.start_listening();
    return app;
}


function start_server() {
    (async () => {
        await setup_db();
        await exports.set_middlewares();
        await set_routes();
        await exports.fireup_server();
    })();
}

if (process.env.NODE_ENV != 'test') {
    start_server();
}

module.exports.app = app;