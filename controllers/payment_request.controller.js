const payment_request_service = require('../services/payment_request.service');
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
        if (!await authorization_handler.check_role_authorization('payment_request.create', req, res)) {
            return;
        }
        if (!req.body.display_id || !req.body.contract_id || !req.body.requested_by_user_id || !req.body.amount || !req.body.request_date || !req.body.transaction_reference_id) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
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
        if (!await authorization_handler.check_role_authorization('payment_request.search', req, res)) {
            return;
        }
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
        if (!await authorization_handler.check_role_authorization('payment_request.get_by_id', req, res)) {
            return;
        }
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
        if (!await authorization_handler.check_role_authorization('payment_request.update', req, res)) {
            return;
        }
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
        if (!await authorization_handler.check_role_authorization('payment_request.delete', req, res)) {
            return;
        }
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
        if (!await authorization_handler.check_role_authorization('payment_request.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await payment_request_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Payment requests retrieved successfully!', {
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


///////////////////////////////////////////////////////////////////////////////////
//Middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.authorize_create = async (req, res, next) => {
    try{
        req.context = 'payment_request.create';
        await authorization_handler.check_role_authorization(req.user, req.context);
        //Perform other authorization checks here...

        //Move on...
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_create = async (req, res, next) => {
    try{
        await body('display_id').exists().run(req);
        await body('contract_id').exists().isUUID().run(req);
        await body('requested_by_user_id').exists().isUUID().run(req);
        await body('amount').exists().run(req);
        await body('request_date').exists().trim().isDate().run(req);
        await body('transaction_reference_id').exists().trim().run(req);
        
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

exports.authorize_search = async (req, res, next) => {
    try{
        req.context = 'payment_request.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        //Perform other authorization checks here...

        //Move on...
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_search = async (req, res, next) => {
    try{
        // await body('name', 'Company name should be atleast 2 character long.').exists().isLength({ min: 2 }).trim().escape().run(req);
        // const result = validationResult(req);
        // if(!result.isEmpty()) {
        //     result.throw();
        // }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try{
        req.context = 'payment_request.get_by_id';
        await authorization_handler.check_role_authorization(req.user, req.context);
        //Perform other authorization checks here...

        //Move on...
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_get_by_id =  async (req, res, next) => {
    try{
        param('id').exists().isUUID().run(req);
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
 
exports.authorize_update = async (req, res, next) => {
    try{
        req.context = 'payment_request.update';
        await authorization_handler.check_role_authorization(req.user, req.context);
        //Perform other authorization checks here...

        //Move on...
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_update =  async (req, res, next) => {
    try{
        param('id').exists().isUUID().run(req);
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

exports.authorize_delete = async (req, res, next) => {
    try{
        req.context = 'payment_request.update';
        await authorization_handler.check_role_authorization(req.user, req.context);
        //Perform other authorization checks here...

        //Move on...
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_delete =  async (req, res, next) => {
    try{
        param('id').exists().isUUID().run(req);
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