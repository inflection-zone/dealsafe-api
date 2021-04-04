'use strict';

const db = require('../database/connection');
const Company = require('../database/models/Company').Model;
const Address = require('../database/models/Address').Model;
const User = require('../database/models/User').Model;
const helper = require('../common/helper');
const { ApiError } = require('../common/api_error');
const logger = require('../common/logger');
const _ = require('lodash');
const Op = require('sequelize').Op;

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
        var record = await Company.create(entity);
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
        if (filter.hasOwnProperty('name')) {
            search.where.name = { [Op.iLike]: '%' + filter.name + '%' };
        }
        var records = await Company.findAll(search);
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
        var record = await Company.findOne(search);
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
        var res = await Company.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new ApiError('Unable to update company!');
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
        throw(error);
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
        throw(error);
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
        var record = await Company.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of company with id ' + id.toString() + '!';
        throw(error);
    }
}

module.exports.company_exists_with = async (phone, email, gstn, tan, name = null) => {
    try {
        var search = {
            where: {
                is_active: true
            }
        };
        // if(name){
        //     search.name = {[Op.iLike]: '%' + name + '%' };
        // }
        if (phone) {
            search.contact_number = { [Op.iLike]: '%' + phone + '%' };
        }
        if (email) {
            search.contact_email = { [Op.iLike]: '%' + email + '%' };
        }
        if (gstn) {
            search.GSTN = { [Op.iLike]: '%' + gstn + '%' };
        }
        if (tan) {
            search.TAN = { [Op.iLike]: '%' + email + '%' };
        }
        var records = await Company.findAll(search);
        return records.length > 0;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of company!';
        throw(error);
    }
}

function get_entity_to_save(request_body) {
    return {
        display_id: helper.generate_display_id(),
        name: request_body.name ? request_body.name : null,
        description: request_body.description ? request_body.description : null,
        default_address_id: request_body.default_address_id ? request_body.default_address_id : null,
        contact_email: request_body.contact_email ? request_body.contact_email : null,
        contact_number: request_body.contact_number ? request_body.contact_number : null,
        GSTN: request_body.GSTN ? request_body.GSTN : null,
        PAN: request_body.PAN ? request_body.PAN : null,
        TAN: request_body.TAN ? request_body.TAN : null,
        contact_person_id: request_body.contact_person_id ? request_body.contact_person_id : null,
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
    if (request_body.hasOwnProperty('default_address_id')) {
        updates.default_address_id = request_body.default_address_id;
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
    if (request_body.hasOwnProperty('contact_person_id')) {
        updates.contact_person_id = request_body.contact_person_id;
    }
    if (request_body.hasOwnProperty('subscription_type')) {
        updates.subscription_type = request_body.subscription_type;
    }
    return updates;
}

async function get_object_to_send(record) {
    if (record == null) {
        return null;
    }
    var address = await Address.findByPk(record.default_address_id);
    var contact_person = {};
    if(record.contact_person_id){
        var user = await User.findByPk(record.contact_person_id);
        if(user != null){
            contact_person['display_id'] = user.display_id;
            contact_person['first_name'] = user.first_name;
            contact_person['last_name'] = user.last_name;
            contact_person['prefix'] = user.prefix;
            contact_person['phone'] = user.phone;
            contact_person['email'] = user.email;
            contact_person['last_name'] = user.last_name;
            contact_person['gender'] = user.gender;
            contact_person['profile_picture'] = user.profile_picture;
        }
    }
    return {
        id: record.id,
        display_id: record.display_id,
        name: record.name,
        description: record.description,
        default_address_id: record.default_address_id,
        default_address: address,
        contact_email: record.contact_email,
        contact_number: record.contact_number,
        GSTN: record.GSTN,
        PAN: record.PAN,
        TAN: record.TAN,
        contact_person_id: record.contact_person_id,
        contact_person: contact_person,
        subscription_type: record.subscription_type
    };
}
