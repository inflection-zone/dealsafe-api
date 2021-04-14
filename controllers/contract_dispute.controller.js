const contract_dispute_service = require('../services/contract_dispute.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const { ApiError } = require('../common/api_error');
const _ = require('lodash');
const { query, body, oneOf, validationResult, param } = require('express-validator');

////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        if (!req.body.contract_id || !req.body.reason || !req.body.raised_by || !req.body.raised_date || !req.body.is_resolved || !req.body.is_blocking) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
        const entity = await contract_dispute_service.create(req.body);
        response_handler.set_success_response(res, req, 201, 'ContractDispute added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        var filter = get_search_filters(req);
        const entities = await contract_dispute_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Contract disputes retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await contract_dispute_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'ContractDispute with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await contract_dispute_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'ContractDispute retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await contract_dispute_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'ContractDispute with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await contract_dispute_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'ContractDispute updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('ContractDispute cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await contract_dispute_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'ContractDispute with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await contract_dispute_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'ContractDispute deleted successfully!', result);
    } catch (error) {
       response_handler.handle_error(error, res, req);
    }
};

exports.get_deleted = async (req, res) => {
    try {
        const deleted_entities = await contract_dispute_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Contract disputes retrieved successfully!', {
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
        req.context = 'contract_dispute.create';
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
        req.context = 'contract_dispute.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try{
        req.context = 'contract_dispute.get_by_id';
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
        req.context = 'contract_dispute.update';
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
        req.context = 'contract_dispute.delete';
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
        await body('company_id').exists().isUUID().run(req);
        await body('contract_dispute', 'Address field should be atleast 5 char long.').isLength({ min: 5 }).trim().escape().run(req);
        await body('city').exists().isAlpha().trim().escape().run(req);
        await body('state').exists().isAlpha().trim().escape().run(req);
        await body('country').isAlpha().trim().escape().run(req);
        await body('pincode').isAlphanumeric().trim().escape().run(req);
        await body('address_type').isAlpha().trim().escape().run(req);
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

exports.sanitize_search = async (req, res, next) => {
    try{
        await query('company_id').isUUID().trim().escape().run(req);
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
        await body('company_id').isUUID().run(req);
        await body('contract_dispute', 'Address field should be atleast 5 char long.').isLength({ min: 5 }).trim().escape().run(req);
        await body('city').isAlpha().trim().escape().run(req);
        await body('state').isAlpha().trim().escape().run(req);
        await body('country').isAlpha().trim().escape().run(req);
        await body('pincode').isNumeric().trim().escape().run(req);
        await body('address_type').isAlpha().trim().escape().run(req);
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
    var company_id = req.query.company_id ? req.query.company_id : null;
    if (company_id != null) {
        filter['company_id'] = company_id;
    }
    var city = req.query.city ? req.query.city : null;
    if (city != null) {
        filter['city'] = city;
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

///////////////////////////////////////////////////////////////////////////////////////
