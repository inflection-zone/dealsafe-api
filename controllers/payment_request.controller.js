const payment_request_service = require('../services/payment_request.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const { ApiError } = require('../common/api_error');
const { query, body, oneOf, validationResult, param } = require('express-validator');
////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        const entity = await payment_request_service.create(req.body);
        response_handler.set_success_response(res, req, 201, 'PaymentRequest added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        var filter = get_search_filters(req);
        const entities = await payment_request_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Payment requests retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await payment_request_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'PaymentRequest with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await payment_request_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'PaymentRequest retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await payment_request_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'PaymentRequest with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await payment_request_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'PaymentRequest updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('PaymentRequest cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await payment_request_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'PaymentRequest with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await payment_request_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'PaymentRequest deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        const deleted_entities = await payment_request_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Payment requests retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};


///////////////////////////////////////////////////////////////////////////////////
//Authorization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.authorize_create = async (req, res, next) => {
    try{
        req.context = 'payment_request.create';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_create_resource(req.user.user_id, req.body);
        if (!is_authorized) {
            throw new ApiError('Permission denied', 403);
        }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_search = async (req, res, next) => {
    try{
        req.context = 'payment_request.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try{
        req.context = 'payment_request.get_by_id';
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

exports.authorize_update = async (req, res, next) => {
    try{
        req.context = 'payment_request.update';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied', 403);
        }
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_delete = async (req, res, next) => {
    try{
        req.context = 'payment_request.delete';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_delete_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', 403);
        }
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

///////////////////////////////////////////////////////////////////////////////////
//Sanitization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.sanitize_create = async (req, res, next) => {
    try {
        await query('contract_id').exists().isUUID().trim().escape().run(req);
        await query('milestone_id').exists().isUUID().trim().escape().run(req);
        await query('raised_by').exists().isUUID().trim().escape().run(req);
        await query('reason').exists().isAlphanumeric().isLength({ max: 255 }).trim().escape().run(req);
        await query('is_blocking').exists().isBoolean().trim().escape().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_search = async (req, res, next) => {
    try{
        await query('contract_id').isUUID().trim().escape().run(req);
        await query('milestone_id').isUUID().trim().escape().run(req);
        await query('raised_by').isUUID().trim().escape().run(req);
        await query('reason').isAlphanumeric().isLength({max:255}).trim().escape().run(req);
        await query('is_blocking').isBoolean().trim().escape().run(req);
        await query('from_raised_date').isDate().trim().escape().run(req);
        await query('to_raised_date').isDate().trim().escape().run(req);
        await query('from_resolution_date').isDate().trim().escape().run(req);
        await query('to_resolution_date').isDate().trim().escape().run(req);
        await query('is_resolved').isBoolean().trim().escape().run(req);
        await query('arbitrator_user_id').isUUID().trim().escape().run(req);
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

exports.sanitize_update =  async (req, res, next) => {
    try{
        await param('id').exists().isUUID().run(req);
        await body('milestone_id').isUUID().trim().escape().run(req);
        await body('reason').isAlphanumeric().isLength({ max: 255 }).trim().escape().run(req);
        await body('is_blocking').isBoolean().trim().escape().run(req);
        await body('is_resolved').isBoolean().trim().escape().run(req);
        await body('arbitrator_user_id').isUUID().trim().escape().run(req);
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

exports.sanitize_delete =  async (req, res, next) => {
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

    var contract_id = req.query.contract_id ? req.query.contract_id : null;
    if (contract_id != null) {
        filter['contract_id'] = contract_id;
    }
    var milestone_id = req.query.milestone_id ? req.query.milestone_id : null;
    if (milestone_id != null) {
        filter['milestone_id'] = milestone_id;
    }
    var raised_by = req.query.raised_by ? req.query.raised_by : null;
    if (raised_by != null) {
        filter['raised_by'] = raised_by;
    }
    var is_resolved = req.query.is_resolved ? req.query.is_resolved : null;
    if (is_resolved != null) {
        filter['is_resolved'] = is_resolved;
    }
    var is_blocking = req.query.is_blocking ? req.query.is_blocking : null;
    if (is_blocking != null) {
        filter['is_blocking'] = is_blocking;
    }
    var from_raised_date = req.query.from_raised_date ? req.query.from_raised_date : null;
    var to_raised_date = req.query.to_raised_date ? req.query.to_raised_date : null;
    if (from_raised_date != null && to_raised_date != null) {
        filter['from_raised_date'] = from_raised_date;
        filter['to_raised_date'] = to_raised_date;
    }
    var from_resolution_date = req.query.from_resolution_date ? req.query.from_resolution_date : null;
    var to_resolution_date = req.query.to_resolution_date ? req.query.to_resolution_date : null;
    if (from_resolution_date != null && to_resolution_date != null) {
        filter['from_resolution_date'] = from_resolution_date;
        filter['to_resolution_date'] = to_resolution_date;
    }
    return filter;
}

///////////////////////////////////////////////////////////////////////////////////////

async function is_user_authorized_to_create_resource(user_id, request_body) {
    return true;
}

async function is_user_authorized_to_access_resource(user_id, resource_id) {
    return true;
}

async function is_user_authorized_to_update_resource(user_id, resource_id) {
    return true;
}

async function is_user_authorized_to_delete_resource(user_id, resource_id) {
    return true;
}

///////////////////////////////////////////////////////////////////////////////////
