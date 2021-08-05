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
        response_handler.set_success_response(res, req, 201, 'Contract milestone added successfully!', {
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
            throw new ApiError('Contract milestone with id ' + id.toString() + ' cannot be found!', null, 404);
        }
        const entity = await contract_milestone_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'Contract milestone retrieved successfully!', {
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
            throw new ApiError('Contract milestone with id ' + id.toString() + ' cannot be found!', null, 404);
        }
        var updated = await contract_milestone_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'Contract milestone updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Contract milestone cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await contract_milestone_service.exists(id);
        if (!exists) {
            throw new ApiError('Contract milestone with id ' + id.toString() + ' cannot be found!', null, 404);
        }
        var result = await contract_milestone_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'Contract milestone deleted successfully!', result);
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
    try {
        req.context = 'contract_milestone.create';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_create_resource(req.user.user_id, req.body);
        if (!is_authorized) {
            throw new ApiError('Permission denied', null, 403);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.authorize_search = async (req, res, next) => {
    try {
        req.context = 'contract_milestone.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try {
        req.context = 'contract_milestone.get_by_id';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_access_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.authorize_update = async (req, res, next) => {
    try {
        req.context = 'contract_milestone.update';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.authorize_delete = async (req, res, next) => {
    try {
        req.context = 'contract_milestone.delete';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_delete_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

///////////////////////////////////////////////////////////////////////////////////
//Sanitization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.sanitize_create = async (req, res, next) => {
    try {
        await body('contract_id').exists().isUUID().run(req);
        await body('name', 'Milestone name should be atleast 5 char long.').exists().isLength({ min: 5 }).trim().escape().run(req);
        await body('description').optional({ checkFalsy: true, nullable: true }).isAscii().isLength({ min: 5 }).trim().escape().run(req);
        await body('execution_planned_start_date').trim().exists().toDate().run(req);
        await body('execution_planned_end_date').trim().exists().toDate().run(req);
        await body('milestone_amount').isDecimal().trim().escape().run(req);

        // custom((value, { req }) => {
        //     if (value.getTime() < req.body.execution_planned_start_date.getTime()) {
        //         throw new ApiError('Planned execution end date must be later than start date', 422);
        //     }
        // })

        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.sanitize_search = async (req, res, next) => {
    try {
        await query('name').trim().optional().escape().run(req);
        await query('contract_id').isUUID().trim().exists().escape().run(req);
        await query('execution_planned_start_date').trim().optional().isDate().escape().run(req);
        await query('execution_planned_end_date').trim().optional().isDate().escape().run(req);
        await query('page_number').trim().optional().escape().run(req);
        await query('items_per_page').trim().optional().escape().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.sanitize_get_by_id = async (req, res, next) => {
    try {
        await param('id').exists().isUUID().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.sanitize_update = async (req, res, next) => {
    try {
        await param('id').exists().isUUID().run(req);
        await body('name', 'Milestone name should be atleast 5 char long.').optional().isLength({ min: 5 }).trim().escape().run(req);
        await body('description').optional().isAscii().isLength({ min: 5 }).trim().escape().run(req);
        await body('execution_planned_start_date').optional().toDate().run(req);
        await body('execution_planned_end_date').optional().toDate().run(req);
        await body('execution_actual_start_date').optional().toDate().trim().escape().run(req);
        await body('execution_actual_end_date').optional().toDate().trim().escape().run(req);
        await body('milestone_amount').optional().isDecimal().trim().escape().run(req);
        await body('current_status').optional().isInt().trim().escape().run(req);
        await body('is_cancelled').optional().isBoolean().trim().escape().run(req);
        await body('is_closed').optional().isBoolean().trim().escape().run(req);
        await body('transaction_id').optional().isUUID().trim().escape().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.sanitize_delete = async (req, res, next) => {
    try {
        await param('id').exists().isUUID().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

///////////////////////////////////////////////////////////////////////////////////////

function get_search_filters(req) {
    var filter = {};
    var contract_id = req.query.contract_id ? req.query.contract_id : null;
    if (contract_id != null) {
        filter['contract_id'] = contract_id;
    }

    var milestone_name = req.query.name ? req.query.name : null;
    if (milestone_name != null) {
        filter['name'] = milestone_name;
    }

    var execution_planned_start_date = req.query.execution_planned_start_date ? req.query.execution_planned_start_date : null;
    //execution_planned_start_date = execution_planned_start_date.getFullYear()+"-"+String(execution_planned_start_date.getMonth()).padStart(2,'0')+"-"+String(execution_planned_start_date.getDay()).padStart(2,'0')+" 05:30:00+05:30";
    
    if (execution_planned_start_date != null) {
        filter['execution_planned_start_date'] = execution_planned_start_date+" 05:30:00+05:30";
    }
    
    var execution_planned_end_date = req.query.execution_planned_end_date ? req.query.execution_planned_end_date : null;
     
    //execution_planned_end_date = execution_planned_end_date.getFullYear()+"-"+String(execution_planned_end_date.getMonth()).padStart(2,'0')+"-"+String(execution_planned_end_date.getDay()).padStart(2,'0')+" 05:30:00+05:30";
    if (execution_planned_end_date != null) {
        filter['execution_planned_end_date'] = execution_planned_end_date+" 05:30:00+05:30";
    }

    var sort_type = req.query.sort_type ? req.query.sort_type : 'descending';
    var sort_by = req.query.sort_by ? req.query.sort_by : 'created_date';
    filter['sort_type'] = sort_type;
    filter['sort_by'] = sort_by;

    var page_number = req.query.page_number ? req.query.page_number : 1;
    var items_per_page = req.query.items_per_page ? req.query.items_per_page : 10;
    filter['page_number'] = page_number;
    filter['items_per_page'] = items_per_page;
    
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
