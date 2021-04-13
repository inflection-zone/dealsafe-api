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
    try{
        await body('contract_id').exists().isUUID().trim().escape().run(req);
        await body('milestone_id').exists().isUUID().trim().escape().run(req);
        await body('requested_by_user_id').exists().isUUID().trim().escape().run(req);
        await body('requested_to_company_id').exists().isUUID().trim().escape().run(req);
        await body('amount').exists().isDecimal().trim().escape().run(req);
        await body('remarks').trim().isLength({ max: 255 }).run(req);
        const result = validationResult(req);
        if(!result.isEmpty()) {
            result.throw();
        }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_search = async (req, res, next) => {
    try{
        await query('contract_id').isUUID().trim().escape().run(req);
        await query('milestone_id').isUUID().trim().escape().run(req);
        await query('requested_by').isUUID().trim().escape().run(req);
        await query('from_amount').isDecimal().trim().escape().run(req);
        await query('to_amount').isDecimal().trim().escape().run(req);
        await query('from_date').isDate().trim().escape().run(req);
        await query('to_date').isDate().trim().escape().run(req);
        const result = validationResult(req);
        if(!result.isEmpty()) {
            result.throw();
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
            result.throw();
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
        await body('requested_by_user_id').isUUID().trim().escape().run(req);
        await body('requested_to_company_id').isUUID().trim().escape().run(req);
        await body('amount').isDecimal().trim().escape().run(req);
        await body('transaction_reference_id').trim().run(req);
        await body('escrow_bank_reference_id').trim().run(req);
        await body('remarks').trim().isLength({ max: 255 }).run(req);
        const result = validationResult(req);
        if(!result.isEmpty()) {
            result.throw();
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
            result.throw();
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
    var requested_by = req.query.requested_by ? req.query.requested_by : null;
    if (requested_by != null) {
        filter['requested_by'] = requested_by;
    }
    var from_amount = req.query.from_amount ? req.query.from_amount : null;
    var to_amount = req.query.to_amount ? req.query.to_amount : null;
    if (from_amount != null && to_amount != null) {
        filter['from_amount'] = from_amount;
        filter['to_amount'] = to_amount;
    }
    var from_date = req.query.from_date ? req.query.from_date : null;
    var to_date = req.query.to_date ? req.query.to_date : null;
    if (from_amount != null && to_amount != null) {
        filter['from_date'] = from_date;
        filter['to_date'] = to_date;
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
