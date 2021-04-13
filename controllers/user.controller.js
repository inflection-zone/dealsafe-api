const user_service = require('../services/user.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const logger = require('../common/logger');
const Roles = require('../common/constants').Roles;
const authorization_handler = require('../common/authorization_handler');
const { ApiError } = require('../common/api_error');
const _ = require('lodash');
const { query, body, oneOf, validationResult, param } = require('express-validator');

////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        const entity = await user_service.create(req.body, [Roles.BasicUser]);
        response_handler.set_success_response(res, req, 201, 'User added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
};

exports.search = async (req, res) => {
    try {
        var filter = get_search_filters(req);
        const entities = await user_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Users retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req.context);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await user_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'User with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await user_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'User retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
};

exports.get_by_display_id = async (req, res) => {
    try {
        var displayId = req.params.displayId;
        const entity = await user_service.get_by_display_id(displayId);
        if (entity == null) {
            res.statusCode = 404;
            throw new Error('User with display id ' + displayId.toString() + ' cannot be found!');
        }
        response_handler.set_success_response(res, req, 200, 'User retrieved successfully!', { entity: entity });
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
};

exports.update = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await user_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'User with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await user_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'User updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('User cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
};

exports.delete = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await user_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'User with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await user_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'User deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        const deleted_entities = await user_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Users retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
};

exports.generate_otp = async (req,res) => {
    try{
        const phone = (typeof req.body.phone != 'undefined') ? req.body.phone : null;
        const user_name = (typeof req.body.user_name != 'undefined') ? req.body.user_name : null;
        const user_id = (typeof req.body.user_id != 'undefined') ? req.body.user_id : null;

        if (phone == null && user_id == null && user_name == null) {
            response_handler.set_failure_response(res, 400, 'Phone, user_name or user_id must be provided!', req);
            return;
        };
        var u = await user_service.generate_otp(phone, user_name, user_id);
        response_handler.set_success_response(res, req, 200, "Your OTP", { entity: u });
    }
    catch (error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.login_with_otp = async (req,res) => {
    try{
        const phone = (typeof req.body.phone != 'undefined') ? req.body.phone : null;
        const user_name = (typeof req.body.user_name != 'undefined') ? req.body.user_name : null;
        const user_id = (typeof req.body.user_id != 'undefined') ? req.body.user_id : null;
        const otp = (typeof req.body.otp != 'undefined') ? req.body.otp : null;

        if (phone == null && user_id == null && user_name == null) {
            response_handler.set_failure_response(res, 400, 'Phone, user_name or user_id must be provided!', req);
            return;
        };

        if(otp == null){
            response_handler.set_failure_response(res, 400 , 'OTP is missing', req)
        }
        var u = await user_service.login_with_otp(phone, user_name, user_id , otp);
        if (u == null) {
            response_handler.set_failure_response(res, 404, 'User not found!', req);
            return;
        };

        var user = u.user;
        var first_name = (user.first_name != null) ? user.first_name : '';
        var last_name = (user.last_name != null) ? user.last_name : '';
        var name = first_name + ' ' + last_name;
        var message = 'User \'' + name + '\' logged in successfully!';
        response_handler.set_success_response(res, req, 200, message, { entity: u });
    }
    catch (error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.login_with_password = async (req, res) => {
    try {
        const phone = (typeof req.body.phone != 'undefined') ? req.body.phone : null;
        const email = (typeof req.body.email != 'undefined') ? req.body.email : null;
        const user_name = (typeof req.body.user_name != 'undefined') ? req.body.user_name : null;
        const password = (typeof req.body.password != 'undefined') ? req.body.password : null;

        if (phone == null && email == null && user_name == null) {
            response_handler.set_failure_response(res, 400, 'Phone, email or username must be provided!', req);
            return;
        }
        if (password == null) {
            response_handler.set_failure_response(res, 400, 'Password must be provided!', req);
            return;
        }
        var u = await user_service.login(phone, email, user_name, password);
        if (u == null) {
            response_handler.set_failure_response(res, 404, 'User not found!', req);
            return;
        }
        var user = u.user;
        var first_name = (user.first_name != null) ? user.first_name : '';
        var last_name = (user.last_name != null) ? user.last_name : '';
        var name = first_name + ' ' + last_name;
        var message = 'User \'' + name + '\' logged in successfully!';
        response_handler.set_success_response(res, req, 200, message, { entity: u }, false);
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
};

exports.change_password = async (req, res) => {
    try {
        if (!req.body.new_password) {
            response_handler.set_failure_response(res, 422, 'Missing required parameters.', req);
            return;
        }
        const changed = await user_service.change_password(req.user, req.body.previous_password, req.body.new_password);
        if (!changed) {
            response_handler.set_failure_response(res, 400, 'Problems encountered in updating the password!', req);
            return;
        }
        response_handler.set_success_response(res, req, 201, 'Password updated successfully!', null);
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
};




///////////////////////////////////////////////////////////////////////////////////
//Authorization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.authorize_create = async (req, res, next) => {
    try{
        req.context = 'user.create';
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
        req.context = 'user.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try{
        req.context = 'user.get_by_id';
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
        req.context = 'user.update';
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
        req.context = 'user.delete';
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
        await body('prefix').exists().isLength({ min: 1 }).trim().escape().run(req);
        await body('first_name').exists().isAlpha().isLength({ min: 1 }).trim().escape().run(req);
        await body('last_name').exists().isAlpha().isLength({ min: 1 }).trim().escape().run(req);
        await body('phone').isAlpha().isLength({ min: 10 }).trim().escape().run(req);
        await body('email').normalizeEmail().isEmail().trim().escape().run(req);
        await body('password').trim().run(req);
        await body('company_id').exists().isUUID().run(req);
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
        await query('company_id').isUUID().trim().escape().run(req);
        await query('name').isAlpha().trim().escape().run(req);
        await query('phone').trim().escape().run(req);
        await query('email').trim().escape().run(req);
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
        await param('id').isUUID().run(req);
        await body('prefix').isLength({ min: 1 }).trim().escape().run(req);
        await body('first_name').isAlpha().isLength({ min: 1 }).trim().escape().run(req);
        await body('last_name').isAlpha().isLength({ min: 1 }).trim().escape().run(req);
        await body('phone').isAlpha().isLength({ min: 10 }).trim().escape().run(req);
        await body('email').normalizeEmail().isEmail().trim().escape().run(req);
        await body('company_id').isUUID().run(req);
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
    var name = req.query.name ? req.query.name : null;
    if (name != null) {
        filter['name'] = name;
    }
    var phone = req.query.phone ? req.query.phone : null;
    if (phone != null) {
        filter['phone'] = phone;
    }
    var email = req.query.email ? req.query.email : null;
    if (email != null) {
        filter['email'] = email;
    }
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
