const agreement_clause_service = require('../services/agreement_clause.service');
const response_handler = require('../common/response_handler');
const helper = require('../common/helper');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const { ApiError } = require('../common/api_error');
const _ = require('lodash');
const { query, body, oneOf, validationResult, param } = require('express-validator');

////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        const entity = await agreement_clause_service.create(req.body);
        response_handler.set_success_response(res, req, 201, 'Agreement clause added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        var filter = get_search_filters(req);
        const entities = await agreement_clause_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Agreement clauses retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await agreement_clause_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Agreement clause with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await agreement_clause_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'Agreement clause retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await agreement_clause_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Agreement clause with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await agreement_clause_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'Agreement clause updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Agreement clause cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await agreement_clause_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Agreement clause with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await agreement_clause_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'Agreement clause deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        const deleted_entities = await agreement_clause_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Agreement clauses retrieved successfully!', {
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
        req.context = 'agreement_clause.create';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_create_resource(req.user.user_id, req.body);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', 403);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_search = async (req, res, next) => {
    try {
        req.context = 'agreement_clause.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try {
        req.context = 'agreement_clause.get_by_id';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_access_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_update = async (req, res, next) => {
    try {
        req.context = 'agreement_clause.update';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_delete = async (req, res, next) => {
    try {
        req.context = 'agreement_clause.delete';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_delete_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

///////////////////////////////////////////////////////////////////////////////////
//Sanitization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.sanitize_create = async (req, res, next) => {
    try {
        await body('contract_id').exists().isUUID().run(req);
        await body('milestone_id').isUUID().trim().escape().run(req);
        await body('text').exists().isAlphanumeric().trim().escape().run(req);
        await body('added_by').exists().isUUID().trim().escape().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.throw();
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_search = async (req, res, next) => {
    try {
        await query('contract_id').isUUID().trim().escape().run(req);
        await query('milestone_id').isUUID().trim().escape().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.throw();
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_get_by_id = async (req, res, next) => {
    try {
        await param('id').exists().isUUID().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.throw();
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_update = async (req, res, next) => {
    try {
        await param('id').exists().isUUID().run(req);
        await body('contract_id').exists().isUUID().run(req);
        await body('milestone_id').isUUID().trim().escape().run(req);
        await body('text').exists().isAlphanumeric().trim().escape().run(req);
        await body('added_by').exists().isUUID().trim().escape().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.throw();
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_delete = async (req, res, next) => {
    try {
        await param('id').exists().isUUID().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.throw();
        }
        next();
    }
    catch (error) {
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
