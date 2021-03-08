'use strict';

const db = require('../database/connection');
const Notification = require('../database/models/Notification').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (requestBody) => {
    try {
        var entity = get_entity_to_save(requestBody)
        var record = await Notification.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while creating notification instance!';
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
        var records = await Notification.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while retrieving notification instances!';
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
        var record = await Notification.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while retrieving notification by id!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.update = async (id, requestBody) => {

    try {
        let updates = get_updates(requestBody);
        var res = await Notification.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new Error('Unable to update notification!');
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
        var msg = 'Problem encountered while updating notification!';
        error_handler.throw_service_error(error, msg);
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
        var msg = 'Problem encountered while deleting notification!';
        error_handler.throw_service_error(error, msg);
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
        var msg = 'Problem encountered while deleted instances of notification!';
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
        var record = await Notification.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of notification with id ' + id.toString() + '!';
        error_handler.throw_service_error(error, msg);
    }
}

function get_entity_to_save(requestBody) {
    return {
        user_id: requestBody.user_id ? requestBody.user_id : null,
        notification_type: requestBody.notification_type ? requestBody.notification_type : null,
        details_json_object: requestBody.details_json_object ? requestBody.details_json_object : null,
        text: requestBody.text ? requestBody.text : null,
        generated_on: requestBody.generated_on ? requestBody.generated_on : null,
        read_date: requestBody.read_date ? requestBody.read_date : null
    };
}

function get_updates(requestBody) {
    let updates = {};
    if (requestBody.hasOwnProperty('user_id')) {
        updates.user_id = requestBody.user_id;
    }
    if (requestBody.hasOwnProperty('notification_type')) {
        updates.notification_type = requestBody.notification_type;
    }
    if (requestBody.hasOwnProperty('details_json_object')) {
        updates.details_json_object = requestBody.details_json_object;
    }
    if (requestBody.hasOwnProperty('text')) {
        updates.text = requestBody.text;
    }
    if (requestBody.hasOwnProperty('generated_on')) {
        updates.generated_on = requestBody.generated_on;
    }
    if (requestBody.hasOwnProperty('read_date')) {
        updates.read_date = requestBody.read_date;
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