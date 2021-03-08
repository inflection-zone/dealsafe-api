'use strict';

const db = require('../database/connection');
const Address = require('../database/models/Address').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (requestBody) => {
    try {
        var entity = get_entity_to_save(requestBody)
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

module.exports.update = async (id, requestBody) => {

    try {
        let updates = get_updates(requestBody);
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

function get_entity_to_save(requestBody) {
    return {
        address: requestBody.address ? requestBody.address : null,
        city: requestBody.city ? requestBody.city : null,
        state: requestBody.state ? requestBody.state : null,
        country: requestBody.country ? requestBody.country : null,
        pincode: requestBody.pincode ? requestBody.pincode : null,
        address_type: requestBody.address_type ? requestBody.address_type : null
    };
}

function get_updates(requestBody) {
    let updates = {};
    if (requestBody.hasOwnProperty('address')) {
        updates.address = requestBody.address;
    }
    if (requestBody.hasOwnProperty('city')) {
        updates.city = requestBody.city;
    }
    if (requestBody.hasOwnProperty('state')) {
        updates.state = requestBody.state;
    }
    if (requestBody.hasOwnProperty('country')) {
        updates.country = requestBody.country;
    }
    if (requestBody.hasOwnProperty('pincode')) {
        updates.pincode = requestBody.pincode;
    }
    if (requestBody.hasOwnProperty('address_type')) {
        updates.address_type = requestBody.address_type;
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