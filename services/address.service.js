'use strict';

const db = require('../database/connection');
const Address = require('../database/models/Address').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
        var record = await Address.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while creating address instance!';
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
        var records = await Address.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while retrieving address instances!';
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
        var record = await Address.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while retrieving address by id!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.update = async (id, request_body) => {

    try {
        let updates = get_updates(request_body);
        var res = await Address.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new Error('Unable to update address!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await Address.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while updating address!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.delete = async (id) => {
    try {
        var res = await Address.update({
            is_active: false
        }, {
            where: {
                id: id
            }
        });
        return res.length == 1;
    } catch (error) {
        var msg = 'Problem encountered while deleting address!';
        error_handler.throw_service_error(error, msg);
    }
}
module.exports.get_deleted = async () => {
    try {
        var records = await Address.findAll({
            where: {
                is_active: false
            }
        });
        for (var record of records) {
            objects.push(get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while deleted instances of address!';
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
        var record = await Address.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of address with id ' + id.toString() + '!';
        error_handler.throw_service_error(error, msg);
    }
}

function get_entity_to_save(request_body) {
    return {
        address: request_body.address ? request_body.address : null,
        city: request_body.city ? request_body.city : null,
        state: request_body.state ? request_body.state : null,
        country: request_body.country ? request_body.country : null,
        pincode: request_body.pincode ? request_body.pincode : null,
        address_type: request_body.address_type ? request_body.address_type : null
    };
}

function get_updates(request_body) {
    let updates = {};
    if (request_body.hasOwnProperty('address')) {
        updates.address = request_body.address;
    }
    if (request_body.hasOwnProperty('city')) {
        updates.city = request_body.city;
    }
    if (request_body.hasOwnProperty('state')) {
        updates.state = request_body.state;
    }
    if (request_body.hasOwnProperty('country')) {
        updates.country = request_body.country;
    }
    if (request_body.hasOwnProperty('pincode')) {
        updates.pincode = request_body.pincode;
    }
    if (request_body.hasOwnProperty('address_type')) {
        updates.address_type = request_body.address_type;
    }
    return updates;
}

function get_object_to_send(record) {
    if (record == null) {
        return null;
    }
    return {
        id: record.id,
        address: record.address,
        city: record.city,
        state: record.state,
        country: record.country,
        pincode: record.pincode,
        address_type: record.address_type
    };
}