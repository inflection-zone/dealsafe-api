const notification_service = require('../services/notification.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');

const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const { ApiError } = require('../common/api_error');
const _ = require('lodash');
const { check, body, oneOf, validationResult, param } = require('express-validator');
////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('notification.create', req, res)) {
            return;
        }
        if (!req.body.user_id || !req.body.notification_type || !req.body.text || !req.body.generated_on) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
        const entity = await notification_service.create(req.body);
        response_handler.set_success_response(res, req, 201, 'Notification added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('notification.search', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await notification_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Notifications retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('notification.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await notification_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Notification with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await notification_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'Notification retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('notification.update', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await notification_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Notification with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await notification_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'Notification updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Notification cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('notification.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await notification_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Notification with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await notification_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'Notification deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('notification.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await notification_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Notifications retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

function get_search_filters(req) {
    var filter = {};
    //var name = req.query.name ? req.query.name : null;
    // if (name != null) {
    //     filter['name'] = name;
    // }
    return filter;
}