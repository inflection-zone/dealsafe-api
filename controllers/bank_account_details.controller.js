const bank_account_details_service = require('../services/bank_account_details.service');
const company_service = require('../services/company.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const { ApiError } = require('../common/api_error');
const _ = require('lodash');
const { query, body, oneOf, validationResult, param } = require('express-validator');
const standard_validators = require('../common/standard_validators');

////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        var exists = await bank_account_details_service.bank_exists_with(
            req.body.account_number,
            req.body.bank_ifsc_code,
            req.body.account_type,
            //req.body.bank_name,
            //req.body.bank_branch
        );

        if (exists) {
            throw new ApiError('Bank already exists with the given details.', null, 403);
        }

        //Get company id from user id
        var company = await company_service.get_company_id_by_contact_person_id(req.user.user_id);
        if (company == null) {
            throw new ApiError('Company details not exist, please add company details.', null, 403);
        }
        req.company_id = company.id;

        const entity = await bank_account_details_service.create(req);
        response_handler.set_success_response(res, req, 201, 'Bank account details added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        var filter = await get_search_filters(req);
        const entities = await bank_account_details_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Bank account details retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await bank_account_details_service.exists(id);
        if (!exists) {
            throw new ApiError('Bank account details with id ' + id.toString() + ' cannot be found!', null, 404);
        }
        const entity = await bank_account_details_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'Bank account details retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await bank_account_details_service.exists(id);
        if (!exists) {
            throw new ApiError('Bank account details with id ' + id.toString() + ' cannot be found!', null, 404);
        }
        var updated = await bank_account_details_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'Bank account details updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Bank account details cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await bank_account_details_service.exists(id);
        if (!exists) {
            throw new ApiError('Bank account details with id ' + id.toString() + ' cannot be found!', null, 404);
        }
        var result = await bank_account_details_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'Bank account details deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        const deleted_entities = await bank_account_details_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Bank account details retrieved successfully!', {
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
        req.context = 'bank_account_details.create';
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
        req.context = 'bank_account_details.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try {
        req.context = 'bank_account_details.get_by_id';
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
        req.context = 'bank_account_details.update';
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
        req.context = 'bank_account_details.delete';
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
        //await body('company_id').exists().isUUID().run(req);
        //await body('user_id').isUUID().trim().escape().run(req);
        await body('account_number').exists().isAlphanumeric().trim().escape().run(req);
        await body('account_name').exists().isAscii().trim().escape().run(req);
        await body('bank_name').exists().isAscii().trim().escape().run(req);
        await body('bank_branch').exists().isAscii().trim().escape().run(req);
        await body('bank_ifsc_code').exists().trim().escape().isLength({ min: 11, max: 11 }).custom(standard_validators.validateBankIFSC).run(req);
        await body('PAN').exists().trim().isAlphanumeric().isLength({ min: 10, max: 10 }).custom(standard_validators.validatePAN).run(req);
        await body('account_type').exists().trim().escape().isInt().run(req);
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
        await query('company_id').isUUID().trim().escape().run(req);
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
        //await body('company_id').isUUID().run(req);
        //await body('user_id').isUUID().trim().escape().run(req);
        await body('account_number').isAlphanumeric().trim().escape().run(req);
        await body('account_name').isAscii().trim().escape().run(req);
        await body('bank_name').isAscii().trim().escape().run(req);
        await body('bank_branch').isAscii().trim().escape().run(req);
        await body('bank_ifsc_code').trim().escape().isLength({ min: 11, max: 11 }).custom(standard_validators.validateBankIFSC).run(req);
        await body('PAN').trim().isAlphanumeric().isLength({ min: 10, max: 10 }).custom(standard_validators.validatePAN).run(req);
        await body('account_type').trim().escape().isInt().run(req);
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

async function get_search_filters(req) {
    var filter = {};
    var company_id = req.query.company_id ? req.query.company_id : null;
    if (company_id != null) {
        filter['company_id'] = company_id;
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
