'use strict';

const db = require('../database/connection');
const User = require('../database/models/User').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (requestBody) => {
    try {
        var entity = get_entity_to_save(requestBody)
        var record = await User.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while creating user instance!';
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
        var records = await User.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while retrieving user instances!';
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
        var record = await User.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while retrieving user by id!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.update = async (id, requestBody) => {

    try {
        let updates = get_updates(requestBody);
        var res = await User.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new Error('Unable to update user!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await User.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while updating user!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.delete = async (id) => {
    try {
        var res = await User.update({
            is_active: false
        }, {
            where: {
                id: id
            }
        });
        return res.length == 1;
    } catch (error) {
        var msg = 'Problem encountered while deleting user!';
        error_handler.throw_service_error(error, msg);
    }
}
module.exports.get_deleted = async () => {
    try {
        var records = await User.findAll({
            where: {
                is_active: false
            }
        });
        for (var record of records) {
            objects.push(get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while deleted instances of user!';
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
        var record = await User.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of user with id ' + id.toString() + '!';
        error_handler.throw_service_error(error, msg);
    }
}

function get_entity_to_save(requestBody) {
    return {
        display_id: requestBody.display_id ? requestBody.display_id : null,
        first_name: requestBody.first_name ? requestBody.first_name : null,
        last_name: requestBody.last_name ? requestBody.last_name : null,
        prefix: requestBody.prefix ? requestBody.prefix : null,
        phone: requestBody.phone ? requestBody.phone : null,
        email: requestBody.email ? requestBody.email : null,
        user_name: requestBody.user_name ? requestBody.user_name : null,
        password: requestBody.password ? requestBody.password : null,
        profile_picture: requestBody.profile_picture ? requestBody.profile_picture : null,
        gender: requestBody.gender ? requestBody.gender : null,
        birth_date: requestBody.birth_date ? requestBody.birth_date : null,
        company_id: requestBody.company_id ? requestBody.company_id : null,
        company_type: requestBody.company_type ? requestBody.company_type : null,
        is_contact_person_for_organization: requestBody.is_contact_person_for_organization ? requestBody.is_contact_person_for_organization : false,
        primary_address_id: requestBody.primary_address_id ? requestBody.primary_address_id : null,
        deleted_at: requestBody.deleted_at ? requestBody.deleted_at : null,
        last_login: requestBody.last_login ? requestBody.last_login : null
    };
}

function get_updates(requestBody) {
    let updates = {};
    if (requestBody.hasOwnProperty('display_id')) {
        updates.display_id = requestBody.display_id;
    }
    if (requestBody.hasOwnProperty('first_name')) {
        updates.first_name = requestBody.first_name;
    }
    if (requestBody.hasOwnProperty('last_name')) {
        updates.last_name = requestBody.last_name;
    }
    if (requestBody.hasOwnProperty('prefix')) {
        updates.prefix = requestBody.prefix;
    }
    if (requestBody.hasOwnProperty('phone')) {
        updates.phone = requestBody.phone;
    }
    if (requestBody.hasOwnProperty('email')) {
        updates.email = requestBody.email;
    }
    if (requestBody.hasOwnProperty('user_name')) {
        updates.user_name = requestBody.user_name;
    }
    if (requestBody.hasOwnProperty('password')) {
        updates.password = requestBody.password;
    }
    if (requestBody.hasOwnProperty('profile_picture')) {
        updates.profile_picture = requestBody.profile_picture;
    }
    if (requestBody.hasOwnProperty('gender')) {
        updates.gender = requestBody.gender;
    }
    if (requestBody.hasOwnProperty('birth_date')) {
        updates.birth_date = requestBody.birth_date;
    }
    if (requestBody.hasOwnProperty('company_id')) {
        updates.company_id = requestBody.company_id;
    }
    if (requestBody.hasOwnProperty('company_type')) {
        updates.company_type = requestBody.company_type;
    }
    if (requestBody.hasOwnProperty('is_contact_person_for_organization')) {
        updates.is_contact_person_for_organization = requestBody.is_contact_person_for_organization;
    }
    if (requestBody.hasOwnProperty('primary_address_id')) {
        updates.primary_address_id = requestBody.primary_address_id;
    }
    if (requestBody.hasOwnProperty('deleted_at')) {
        updates.deleted_at = requestBody.deleted_at;
    }
    if (requestBody.hasOwnProperty('last_login')) {
        updates.last_login = requestBody.last_login;
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
        first_name: record.first_name,
        last_name: record.last_name,
        prefix: record.prefix,
        phone: record.phone,
        email: record.email,
        user_name: record.user_name,
        password: record.password,
        profile_picture: record.profile_picture,
        gender: record.gender,
        birth_date: record.birth_date,
        company_id: record.company_id,
        company_type: record.company_type,
        is_contact_person_for_organization: record.is_contact_person_for_organization,
        primary_address_id: record.primary_address_id,
        deleted_at: record.deleted_at,
        last_login: record.last_login
    };
}