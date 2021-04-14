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
        var exists = await company_service.company_exists_with(
            req.body.contact_number,
            req.body.contact_email,
            req.body.GSTN,
            req.body.PAN,
            req.body.TAN);
        if (exists) {
            response_handler.set_failure_response(res, 200, 'Company already exists with the given contact details.', req);
            return;
        }
        const entity = await company_service.create(req.body);
        response_handler.set_success_response(res, req, 201, 'Company added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        var filter = get_search_filters(req);
        const entities = await company_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Companies retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await company_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Company with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await company_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'Company retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await company_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Company with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await company_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'Company updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Company cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await company_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Company with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await company_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'Company deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_deleted = async (req, res) => {
    try {
        const deleted_entities = await company_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Companies retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

///////////////////////////////////////////////////////////////////////////////////
// Authorization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.authorize_create = async (req, res, next) => {
    try{
        req.context = 'company.create';
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
        req.context = 'company.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try{
        req.context = 'company.get_by_id';
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
        req.context = 'company.update';
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
        req.context = 'company.update';
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
// Sanitization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.sanitize_create = async (req, res, next) => {
    try{
        await body('name', 'Company name should be atleast 3 character long.').exists().trim().isLength({ min: 3 }).trim().escape().run(req);
        await body('contact_number').exists().isMobilePhone().trim().isLength({ min: 10 }).trim().escape().run(req);
        await body('contact_email').exists().normalizeEmail().trim().isEmail().run(req);
        await body('GSTN').exists().trim().isAlphanumeric().isLength({ min: 15, max:15 }).custom(standard_validators.validateGSTN).run(req);
        await body('PAN').exists().trim().isAlphanumeric().isLength({ min: 10, max:10 }).custom(standard_validators.validatePAN).run(req);
        await body('TAN').exists().trim().isAlphanumeric().isLength({ min: 10, max:10 }).custom(standard_validators.validateTAN).run(req);
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
        await query('user_id').isUUID().trim().escape().run(req);
        await query('name').trim().escape().run(req);
        await query('contact_email').trim().escape().run(req);
        await query('contact_number').trim().escape().run(req);
        await query('gstn').trim().escape().run(req);
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
        await body('name', 'Company name should be atleast 3 character long.').trim().isLength({ min: 3 }).trim().escape().run(req);
        await body('contact_number').trim().isLength({ min: 10 }).trim().escape().run(req);
        await body('contact_email').normalizeEmail().trim().isEmail().run(req);
        await body('GSTN').trim().isAlphanumeric().isLength({ min: 15, max:15 }).custom(standard_validators.validateGSTN).run(req);
        await body('PAN').trim().isAlphanumeric().isLength({ min: 10, max:10 }).custom(standard_validators.validatePAN).run(req);
        await body('TAN').trim().isAlphanumeric().isLength({ min: 10, max:10 }).custom(standard_validators.validateTAN).run(req);
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

////////////////////////////////////////////////////////////////////////

function get_search_filters(req) {
    var filter = {};
    var name = req.query.name ? req.query.name : null;
    if (name != null) {
        filter['name'] = name;
    }
    var user_id = req.query.user_id ? req.query.user_id : null;
    if (user_id != null) {
        filter['user_id'] = user_id;
    }
    var contact_email = req.query.contact_email ? req.query.contact_email : null;
    if (contact_email != null) {
        filter['contact_email'] = contact_email;
    }
    var contact_number = req.query.contact_number ? req.query.contact_number : null;
    if (contact_number != null) {
        filter['contact_number'] = contact_number;
    }
    var gstn = req.query.gstn ? req.query.gstn : null;
    if (gstn != null) {
        filter['gstn'] = gstn;
    }
    return filter;
}

////////////////////////////////////////////////////////////////////////

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
