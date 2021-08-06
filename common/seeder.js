const User = require("../database/models/User").Model;
const RolePrivilege = require("../database/models/RolePrivilege").Model;
const UserRole = require('../database/models/UserRole').Model;
const Role = require('../database/models/Role').Model;
const Privilege = require('../database/models/Privilege').Model;

const privileges_list = require('../data/privileges.data').Privileges;
const role_privileges_list = require('../data/role_privileges.data').RolePrivileges;

const Constants = require('./constants');
const logger = require('../common/logger');
const helper = require('../common/helper');
const Op = require('sequelize').Op;

// const EnterpriseType = require('../database/models/EnterpriseType').Model;
const CityPincode = require("../database/models/CityPincode").Model;

module.exports.seed = async () => {
    try {
        await seed_roles();
        await seed_privileges();
        await seed_role_privileges();
        await seed_city_state();
        //await seed_enterprise_types();
    }
    catch (error) {
        logger.log_error('Problem occurred while seeding the database!' + 'Error: ' + error.message);
    }
}

async function seed_roles() {
    var roles = await Role.findAll();
    if (roles.length > 0) {
        return;
    };
    await Role.create({ name: Constants.Roles.Admin });
    await Role.create({ name: Constants.Roles.Buyer });
    await Role.create({ name: Constants.Roles.Seller });
    await Role.create({ name: Constants.Roles.BasicUser });
}

async function seed_privileges() {
    var privileges = await Privilege.findAll();
    if (privileges.length > 0) {
        return;
    };
    for await (const p of privileges_list) {
        await Privilege.create({ name: p.name, category: p.category });
    }
    logger.log(`Seeded privileges!`);
}

async function seed_role_privileges() {
    var role_privileges = await RolePrivilege.findAll();
    if (role_privileges.length > 0) {
        return;
    };
    for await (const rp of role_privileges_list) {
        await add_role_privileges(rp.role, rp.privileges);
    }
}

async function add_role_privileges(role_name, privileges) {
    var role = await Role.findOne({ where: { name: { [Op.like]: '%' + role_name + '%' } } });
    for await (var p of privileges) {
        var privilege = await Privilege.findOne({ where: { name: { [Op.like]: '%' + p + '%' } } });
        if (privilege != null) {
            await RolePrivilege.create({ role_id: role.id, privilege_id: privilege.id });
        }
    }
}

async function seed_city_state() {
    var count = await CityPincode.count();
    if (count > 0) {
        return;
    };
    await seed_city_pincodes_from_json();
}

async function seed_city_pincodes_from_json() {

    var count = await CityPincode.count();
    if(count > 0) {
        return;
    }

    return new Promise((resolve, reject) => {
        try {
            const stream_array = require('stream-json/streamers/StreamArray');
            const { Writable: writable } = require('stream');
            const path = require('path');
            const fs = require('fs');
            var file_path = path.join(process.cwd(), './data/pincodes.json');
            const fileStream = fs.createReadStream(file_path);
            const jsonStream = stream_array.withParser();

            const processingStream = new writable({
                objectMode: true, //Don't skip this, as we need to operate with objects, not buffers
                write({ key, value }, encoding, callback) {
                    (async () => {
                        await CityPincode.create({
                            city: value.City,
                            pincode: value.Pincode,
                            district: value.District,
                            state: value.State
                        });
                        setTimeout(() => {
                            //console.log(value);
                            //Next record will be read only current one is fully processed
                            callback();
                        }, 1);
                    })();
                }
            });

            //Pipe the streams as follows
            fileStream.pipe(jsonStream.input);
            jsonStream.pipe(processingStream);

            //So we're waiting for the 'finish' event when everything is done.
            processingStream.on('finish', () => {
                var message = 'City, pincode and state data has been seeded successfully!';
                console.log(message);
                resolve(message);
            });

        }
        catch (error) {
            reject(error);
        }
    });
}

