const address_service = require('../services/address.service');
const response_handler = require('../common/response_handler');
const authorization_handler = require('../common/authorization_handler');
const company_service = require('../services/company.service');
const { ApiError } = require('../common/api_error');
const { body, validationResult, param } = require('express-validator');
const helper = require('../common/helper');
///////////////////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        var company = await company_service.get_company_id_by_contact_person_id(req.user.user_id);
        if (company == null) {
            throw new ApiError('Company details not exist, please add company details.', null, 200);
        }
        req.company_id = company.id;

        var is_address_added = await address_service.address_exists_with(req.company_id);
        if (is_address_added) {
            throw new ApiError('Address details already added, please refresh the page and edit address details.', null, 200);
        }
        const entity = await address_service.create(req);
        response_handler.set_success_response(res, req, 200, 'Address added successfully!', {
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
            throw new ApiError('Address with id ' + id.toString() + ' cannot be found!', null, 404);
        }
        const entity = await address_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'Address retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_user_id = async (req, res) => {
    try {
        var id = req.user.user_id;
        var exists = await address_service.exists(id);
        if (!exists) {
            throw new ApiError('Address details not found!', null, 404);
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
            throw new ApiError('Address with id ' + id.toString() + ' cannot be found!', null, 404);
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
            throw new ApiError('Address with id ' + id.toString() + ' cannot be found!', null, 404);
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
    try {
        req.context = 'address.create';
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
        req.context = 'address.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try {
        req.context = 'address.get_by_id';
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
        req.context = 'address.update';
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
        req.context = 'address.delete';
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
        // await body('company_id').exists().isUUID().run(req);
        await body('address', 'Address field should be atleast 5 char long.').isLength({ min: 5 }).trim().escape().run(req);
        await body('city').exists().isAlpha().trim().escape().run(req);
        await body('state').exists().isAlpha().trim().escape().run(req);
        await body('country').isAscii().trim().escape().run(req);
        await body('pincode').isAlphanumeric().trim().escape().run(req);
        //await body('company_id').isUUID().trim().escape().run(req);
        await body('is_company_address').optional().isBoolean().trim().escape().run(req);
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
        await query('city').isAlpha().trim().escape().run(req);
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
        await body('address', 'Address field should be atleast 5 char long.').isLength({ min: 5 }).trim().escape().run(req);
        await body('city').isAlpha().trim().escape().run(req);
        await body('state').trim().optional({ checkFalsy: true }).isAlpha().escape().run(req);
        await body('country').trim().escape().run(req);
        await body('pincode').optional({ checkFalsy: true }).isNumeric().trim().escape().run(req);
        await body('is_company_address').isBoolean().trim().escape().run(req);
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
