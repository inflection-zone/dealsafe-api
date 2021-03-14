'use strict';

const db = require('../database/connection');
const Company = require('../database/models/Company').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
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

module.exports.update = async (id, request_body) => {

    try {
        let updates = get_updates(request_body);
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

function get_entity_to_save(request_body) {
    return {
        display_id: request_body.display_id ? request_body.display_id : null,
        name: request_body.name ? request_body.name : null,
        description: request_body.description ? request_body.description : null,
        default_address: request_body.default_address ? request_body.default_address : null,
        contact_email: request_body.contact_email ? request_body.contact_email : null,
        contact_number: request_body.contact_number ? request_body.contact_number : null,
        GSTN: request_body.gstn ? request_body.gstn : null,
        PAN: request_body.pan ? request_body.pan : null,
        TAN: request_body.tan ? request_body.tan : null,
        contact_person_prefix: request_body.contact_person_prefix ? request_body.contact_person_prefix : null,
        contact_person_first_name: request_body.contact_person_first_name ? request_body.contact_person_first_name : null,
        contact_person_last_name: request_body.contact_person_last_name ? request_body.contact_person_last_name : null,
        primary_address_id: request_body.primary_address_id ? request_body.primary_address_id : null,
        subscription_type: request_body.subscription_type ? request_body.subscription_type : 'On-premises'
    };
}

function get_updates(request_body) {
    let updates = {};
    if (request_body.hasOwnProperty('display_id')) {
        updates.display_id = request_body.display_id;
    }
    if (request_body.hasOwnProperty('name')) {
        updates.name = request_body.name;
    }
    if (request_body.hasOwnProperty('description')) {
        updates.description = request_body.description;
    }
    if (request_body.hasOwnProperty('default_address')) {
        updates.default_address = request_body.default_address;
    }
    if (request_body.hasOwnProperty('contact_email')) {
        updates.contact_email = request_body.contact_email;
    }
    if (request_body.hasOwnProperty('contact_number')) {
        updates.contact_number = request_body.contact_number;
    }
    if (request_body.hasOwnProperty('GSTN')) {
        updates.GSTN = request_body.GSTN;
    }
    if (request_body.hasOwnProperty('PAN')) {
        updates.PAN = request_body.PAN;
    }
    if (request_body.hasOwnProperty('TAN')) {
        updates.TAN = request_body.TAN;
    }
    if (request_body.hasOwnProperty('contact_person_prefix')) {
        updates.contact_person_prefix = request_body.contact_person_prefix;
    }
    if (request_body.hasOwnProperty('contact_person_first_name')) {
        updates.contact_person_first_name = request_body.contact_person_first_name;
    }
    if (request_body.hasOwnProperty('contact_person_last_name')) {
        updates.contact_person_last_name = request_body.contact_person_last_name;
    }
    if (request_body.hasOwnProperty('primary_address_id')) {
        updates.primary_address_id = request_body.primary_address_id;
    }
    if (request_body.hasOwnProperty('subscription_type')) {
        updates.subscription_type = request_body.subscription_type;
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