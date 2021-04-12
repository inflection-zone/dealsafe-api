'use strict';

const Notification = require('../database/models/Notification').Model;
const helper = require('../common/helper');
const { ApiError } = require('../common/api_error');
const logger = require('../common/logger');
const Op = require('sequelize').Op;

///////////////////////////////////////////////////////////////////////////////////////

module.exports.create = async (entity) => {
    try {
        var entity = get_entity_to_save(entity)
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
                is_active: true,
                user_id: filter.user_id
            }
        };
        if (filter.hasOwnProperty('is_read')) {
            search.where.is_read = filter.is_read;
        }
        if (filter.hasOwnProperty('from_date') && filter.hasOwnProperty('to_date')) {
            search.where.created_date = { 
                [Op.gte]: filter.from_date,
                [Op.lte]: filter.to_date
             };
        }
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

module.exports.mark_as_read = async (id) => {
    try {
        var notification = await Notification.findByPk(id);
        notification.is_read = true;
        notification.read_date = new Date();
        await notification.save();
        return get_object_to_send(record);
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
        generated_on: Date.now(),
        is_read: request_body.is_read ? request_body.is_read : false,
        read_date: request_body.read_date ? request_body.read_date : null
    };
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
        is_read: record.is_read,
        read_date: record.read_date
    };
}