'use strict';

const Address = require('../database/models/Address').Model;
const helper = require('../common/helper');
const logger = require('../common/logger');
const Op = require('sequelize').Op;

///////////////////////////////////////////////////////////////////////////////////////

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
        var record = await Address.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        throw(error);
    }
}

module.exports.search = async (filter) => {
    try {
        let objects = [];
        var search = {
            where: {
                is_active: true
            }
        };
        if (filter.hasOwnProperty('company_id')) {
            search.where.company_id = filter.company_id;
        }
        if (filter.hasOwnProperty('city')) {
            search.where.city = { [Op.iLike]: '%' + filter.city + '%' };
        }
        var records = await Address.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        throw(error);
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
        throw(error);
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
        throw(error);
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
        throw(error);
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
        throw(error);
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
        throw(error);
    }
}

///////////////////////////////////////////////////////////////////////////////////////

function get_entity_to_save(request_body) {
    return {
        company_id: request_body.company_id ? request_body.company_id : null,
        address: request_body.address ? unescape(request_body.address) : null,
        city: request_body.city ? request_body.city : null,
        state: request_body.state ? request_body.state : null,
        country: request_body.country ? request_body.country : null,
        pincode: request_body.pincode ? request_body.pincode : null,
        is_company_address: request_body.is_company_address ? request_body.is_company_address : true
    };
}

function get_updates(request_body) {
    let updates = {};
    if (request_body.hasOwnProperty('company_id')) {
        updates.company_id = request_body.company_id;
    }    
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
    if (request_body.hasOwnProperty('is_company_address')) {
        updates.is_company_address = request_body.is_company_address;
    }
    return updates;
}

function get_object_to_send(record) {
    if (record == null) {
        return null;
    }
    return {
        id: record.id,
        company_id: record.company_id,
        address: record.address,
        city: record.city,
        state: record.state,
        country: record.country,
        pincode: record.pincode,
        is_company_address: record.is_company_address
    };
}