const contract_milestone_service = require('../services/contract_milestone.service');
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
        const entity = await contract_milestone_service.create(req.body);
        response_handler.set_success_response(res, req, 201, 'ContractMilestone added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        var filter = get_search_filters(req);
        const entities = await contract_milestone_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Contract milestones retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await contract_milestone_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'ContractMilestone with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await contract_milestone_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'ContractMilestone retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await contract_milestone_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'ContractMilestone with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await contract_milestone_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'ContractMilestone updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('ContractMilestone cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await contract_milestone_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'ContractMilestone with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await contract_milestone_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'ContractMilestone deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        const deleted_entities = await contract_milestone_service.get_deleted(req.user);
       response_handler.set_success_response(res, req, 200, 'Deleted instances of Contract milestones retrieved successfully!', {
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
        req.context = 'contract_milestone.create';
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
        req.context = 'contract_milestone.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try{
        req.context = 'contract_milestone.get_by_id';
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
        req.context = 'contract_milestone.update';
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
        req.context = 'contract_milestone.delete';
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
        await body('contract_id').exists().isUUID().run(req);
        await body('name', 'Milestone name should be atleast 5 char long.').exists().isLength({ min: 5 }).trim().escape().run(req);
        await body('description').isAlpha().isLength({ min: 5 }).trim().escape().run(req);
        await body('created_date').exists().toDate().run(req);
        await body('execution_planned_start_date').exists().toDate().run(req);
        await body('execution_planned_end_date').exists().toDate().custom((value, { req }) => {
            if (value.getTime() < req.body.execution_planned_start_date.getTime()) {
                throw new ApiError('Planned execution end date must be later than start date', 422);
            }
        }).run(req);
        await body('milestone_amount').isDecimal().trim().escape().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
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
        await query('company_id').isUUID().trim().escape().run(req);
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
        await body('name', 'Milestone name should be atleast 5 char long.').isLength({ min: 5 }).trim().escape().run(req);
        await body('description').isAlpha().isLength({ min: 5 }).trim().escape().run(req);
        await body('execution_planned_start_date').toDate().run(req);
        await body('execution_planned_end_date').toDate().run(req);
        await body('execution_actual_start_date').toDate().trim().escape().run(req);
        await body('execution_actual_end_date').toDate().trim().escape().run(req);
        await body('milestone_amount').isDecimal().trim().escape().run(req);
        await body('current_status').isInt().trim().escape().run(req);
        await body('is_cancelled').isBoolean().trim().escape().run(req);
        await body('is_closed').isBoolean().trim().escape().run(req);
        await body('transaction_id').isUUID().trim().escape().run(req);
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
