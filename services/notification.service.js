'use strict';

const db = require('../database/connection');
const Notification = require('../database/models/Notification').Model;
const helper = require('../common/helper');
const { ApiError } = require('../common/api_error');
const logger = require('../common/logger');

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
        var record = await Notification.create(entity);
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
        // if (filter.hasOwnProperty('name')) {
        //     search.where.name = { [Op.iLike]: '%' + filter.name + '%' };
        // }
        var records = await Notification.findAll(search);
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
        var record = await Notification.findOne(search);
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
        var res = await Notification.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new ApiError('Unable to update notification!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await Notification.findOne(search);
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
        var res = await Notification.update({
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
        var records = await Notification.findAll({
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
        var record = await Notification.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        throw(error);
    }
}

function get_entity_to_save(request_body) {
    return {
        user_id: request_body.user_id ? request_body.user_id : null,
        notification_type: request_body.notification_type ? request_body.notification_type : null,
        details_json_object: request_body.details_json_object ? request_body.details_json_object : null,
        text: request_body.text ? request_body.text : null,
        generated_on: request_body.generated_on ? request_body.generated_on : null,
        read_date: request_body.read_date ? request_body.read_date : null
    };
}

function get_updates(request_body) {
    let updates = {};
    if (request_body.hasOwnProperty('user_id')) {
        updates.user_id = request_body.user_id;
    }
    if (request_body.hasOwnProperty('notification_type')) {
        updates.notification_type = request_body.notification_type;
    }
    if (request_body.hasOwnProperty('details_json_object')) {
        updates.details_json_object = request_body.details_json_object;
    }
    if (request_body.hasOwnProperty('text')) {
        updates.text = request_body.text;
    }
    if (request_body.hasOwnProperty('generated_on')) {
        updates.generated_on = request_body.generated_on;
    }
    if (request_body.hasOwnProperty('read_date')) {
        updates.read_date = request_body.read_date;
    }
    return updates;
}

function get_object_to_send(record) {
    if (record == null) {
        return null;
    }
    return {
        id: record.id,
        user_id: record.user_id,
        notification_type: record.notification_type,
        details_json_object: record.details_json_object,
        text: record.text,
        generated_on: record.generated_on,
        read_date: record.read_date
    };
}