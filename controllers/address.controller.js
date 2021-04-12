const address_service = require('../services/address.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const { ApiError } = require('../common/api_error');
const _ = require('lodash');
const { body, validationResult, param } = require('express-validator');

///////////////////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        const entity = await address_service.create(req.body);
        response_handler.set_success_response(res, req, 201, 'Address added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        
        var filter = get_search_filters(req);
        const entities = await address_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Addresses retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await address_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Address with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await address_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'Address retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await address_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Address with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await address_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'Address updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Address cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await address_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Address with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await address_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'Address deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        const deleted_entities = await address_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Addresses retrieved successfully!', {
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
        req.context = 'address.create';
        await authorization_handler.check_role_authorization(req.user, req.context);

        //Perform other authorization checks here...
        var is_authorized = await is_user_authorized_to_create_resource(req.user.user_id);
        if (!is_authorized) {
            throw new ApiError('User has no permission to add the address for others!', 403);
        }
        //Move on...
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_search = async (req, res, next) => {
    try{
        req.context = 'address.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        //Perform other authorization checks here...
        
        var is_authorized = await is_user_authorized_to_access_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('User has no permission to add the address for others!', 403);
        }
        //Move on...
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try{
        req.context = 'address.get_by_id';
        await authorization_handler.check_role_authorization(req.user, req.context);
        //Perform other authorization checks here...

        //Move on...
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}
 
exports.authorize_update = async (req, res, next) => {
    try{
        req.context = 'address.update';
        await authorization_handler.check_role_authorization(req.user, req.context);
        //Perform other authorization checks here...

        //Move on...
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_delete = async (req, res, next) => {
    try{
        req.context = 'address.delete';
        await authorization_handler.check_role_authorization(req.user, req.context);
        //Perform other authorization checks here...

        //Move on...
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

        await body('company_id',).exists().isUUID().run(req);
        await body('address', 'Address field should be atleast 5 char long.').isLength({ min: 5 }).trim().escape().run(req);
        await body('city').exists().isAlpha().trim().escape().run(req);
        await body('state').exists().isAlpha().trim().escape().run(req);
        await body('country').isAlpha().trim().escape().run(req);
        await body('pincode').isAlphanumeric().trim().escape().run(req);
        await body('address_type').isAlphs().trim().escape().run(req);

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

exports.sanitize_update =  async (req, res, next) => {
    try{
        param('id').exists().isUUID().run(req);

        await body('company_id',).isUUID().run(req);
        await body('address', 'Address field should be atleast 5 char long.').isLength({ min: 5 }).trim().escape().run(req);
        await body('city').isAlpha().trim().escape().run(req);
        await body('state').isAlpha().trim().escape().run(req);
        await body('country').isAlpha().trim().escape().run(req);
        await body('pincode').isAlphanumeric().trim().escape().run(req);
        await body('address_type').isAlphs().trim().escape().run(req);

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
