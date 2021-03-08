'use strict';

const db = require('../database/connection');
const Company = require('../database/models/Company').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (requestBody) => {
    try {
        var entity = get_entity_to_save(requestBody)
        var record = await Company.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while creating company instance!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.get_all = async (filter) => {
    try {
        let objects = [];
        var search = {
            where: {
                is_active: true
            }
        };
        // if (filter.hasOwnProperty('name')) {
        //     search.where.name = { [Op.iLike]: '%' + filter.name + '%' };
        // }
        var records = await Company.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while retrieving company instances!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.get_by_id = async (id) => {
    try {
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await Company.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while retrieving company by id!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.update = async (id, requestBody) => {

    try {
        let updates = get_updates(requestBody);
        var res = await Company.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new Error('Unable to update company!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await Company.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while updating company!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.delete = async (id) => {
    try {
        var res = await Company.update({
            is_active: false
        }, {
            where: {
                id: id
            }
        });
        return res.length == 1;
    } catch (error) {
        var msg = 'Problem encountered while deleting company!';
        error_handler.throw_service_error(error, msg);
    }
}
module.exports.get_deleted = async () => {
    try {
        var records = await Company.findAll({
            where: {
                is_active: false
            }
        });
        for (var record of records) {
            objects.push(get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while deleted instances of company!';
        error_handler.throw_service_error(error, msg);
    }
}
module.exports.exists = async (id) => {
    try {
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await Company.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of company with id ' + id.toString() + '!';
        error_handler.throw_service_error(error, msg);
    }
}

function get_entity_to_save(requestBody) {
    return {
        display_id: requestBody.display_id ? requestBody.display_id : null,
        name: requestBody.name ? requestBody.name : null,
        description: requestBody.description ? requestBody.description : null,
        default_address: requestBody.default_address ? requestBody.default_address : null,
        contact_email: requestBody.contact_email ? requestBody.contact_email : null,
        contact_number: requestBody.contact_number ? requestBody.contact_number : null,
        GSTN: requestBody.gstn ? requestBody.gstn : null,
        PAN: requestBody.pan ? requestBody.pan : null,
        TAN: requestBody.tan ? requestBody.tan : null,
        contact_person_prefix: requestBody.contact_person_prefix ? requestBody.contact_person_prefix : null,
        contact_person_first_name: requestBody.contact_person_first_name ? requestBody.contact_person_first_name : null,
        contact_person_last_name: requestBody.contact_person_last_name ? requestBody.contact_person_last_name : null,
        primary_address_id: requestBody.primary_address_id ? requestBody.primary_address_id : null,
        subscription_type: requestBody.subscription_type ? requestBody.subscription_type : 'On-premises'
    };
}

function get_updates(requestBody) {
    let updates = {};
    if (requestBody.hasOwnProperty('display_id')) {
        updates.display_id = requestBody.display_id;
    }
    if (requestBody.hasOwnProperty('name')) {
        updates.name = requestBody.name;
    }
    if (requestBody.hasOwnProperty('description')) {
        updates.description = requestBody.description;
    }
    if (requestBody.hasOwnProperty('default_address')) {
        updates.default_address = requestBody.default_address;
    }
    if (requestBody.hasOwnProperty('contact_email')) {
        updates.contact_email = requestBody.contact_email;
    }
    if (requestBody.hasOwnProperty('contact_number')) {
        updates.contact_number = requestBody.contact_number;
    }
    if (requestBody.hasOwnProperty('GSTN')) {
        updates.GSTN = requestBody.GSTN;
    }
    if (requestBody.hasOwnProperty('PAN')) {
        updates.PAN = requestBody.PAN;
    }
    if (requestBody.hasOwnProperty('TAN')) {
        updates.TAN = requestBody.TAN;
    }
    if (requestBody.hasOwnProperty('contact_person_prefix')) {
        updates.contact_person_prefix = requestBody.contact_person_prefix;
    }
    if (requestBody.hasOwnProperty('contact_person_first_name')) {
        updates.contact_person_first_name = requestBody.contact_person_first_name;
    }
    if (requestBody.hasOwnProperty('contact_person_last_name')) {
        updates.contact_person_last_name = requestBody.contact_person_last_name;
    }
    if (requestBody.hasOwnProperty('primary_address_id')) {
        updates.primary_address_id = requestBody.primary_address_id;
    }
    if (requestBody.hasOwnProperty('subscription_type')) {
        updates.subscription_type = requestBody.subscription_type;
    }
    return updates;
}

function get_object_to_send(record) {
    if (record == null) {
        return null;
    }
    return {
        id: record.id,
        display_id: record.display_id,
        name: record.name,
        description: record.description,
        default_address: record.default_address,
        contact_email: record.contact_email,
        contact_number: record.contact_number,
        GSTN: record.GSTN,
        PAN: record.PAN,
        TAN: record.TAN,
        contact_person_prefix: record.contact_person_prefix,
        contact_person_first_name: record.contact_person_first_name,
        contact_person_last_name: record.contact_person_last_name,
        primary_address_id: record.primary_address_id,
        subscription_type: record.subscription_type
    };
}