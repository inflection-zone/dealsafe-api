const notification_service = require('../services/notification.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const { ApiError } = require('../common/api_error');
const _ = require('lodash');
const { query, body, oneOf, validationResult, param } = require('express-validator');
////////////////////////////////////////////////////////////////////////

exports.search = async (req, res) => {
    try {
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

exports.mark_as_read = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await notification_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Notification with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await notification_service.mark_as_read(id);
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


///////////////////////////////////////////////////////////////////////////////////
//Authorization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.authorize_search = async (req, res, next) => {
    try{
        req.context = 'notification.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try{
        req.context = 'notification.get_by_id';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_access_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied', 403);
        }
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_mark_as_read = async (req, res, next) => {
    try{
        req.context = 'notification.mark_as_read';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

///////////////////////////////////////////////////////////////////////////////////
//Sanitization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.sanitize_search = async (req, res, next) => {
    try{
        await query('user_id').isUUID().trim().escape().run(req);
        await query('from').toDate().trim().escape().run(req);
        await query('to').toDate().trim().escape().run(req);
        await query('is_read').isBoolean().run(req);
        const result = validationResult(req);
        if(!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_get_by_id =  async (req, res, next) => {
    try{
        await param('id').exists().isUUID().run(req);
        const result = validationResult(req);
        if(!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_mark_as_read =  async (req, res, next) => {
    try{
        await param('id').exists().isUUID().run(req);
        const result = validationResult(req);
        if(!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

///////////////////////////////////////////////////////////////////////////////////////

function get_search_filters(req) {
    var filter = {};
    var user_id = req.query.user_id ? req.query.user_id : null;
    if(user_id == null){
        throw new ApiError('Notification search needs user id as mandatory query param.');
    }
    filter['user_id'] = user_id;
    var from_date = req.query.from_date ? req.query.from_date : null;
    var to_date = req.query.to_date ? req.query.to_date : null;
    if (from_date != null && to_date != null) {
        filter['from_date'] = from_date;
        filter['to_date'] = to_date;
    }
    var is_read = req.query.is_read ? req.query.is_read : null;
    if (is_read != null) {
        filter['is_read'] = is_read;
    }
    return filter;
}

///////////////////////////////////////////////////////////////////////////////////////

async function is_user_authorized_to_access_resource(user_id, resource_id) {
    return true;
}

///////////////////////////////////////////////////////////////////////////////////////
