const user_service = require('../services/user.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const logger = require('../common/logger');
const Roles = require('../common/constants').Roles;
const authorization_handler = require('../common/authorization_handler');
const { ApiError } = require('../common/api_error');
const _ = require('lodash');
const { query, body, oneOf, validationResult, param } = require('express-validator');
const path =  require('path');

////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        const entity = await user_service.create(req.body, [Roles.BasicUser]);
        response_handler.set_success_response(res, req, 201, 'User added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
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
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await user_service.exists(id);
        if (!exists) {
            throw new ApiError('User with id ' + id.toString() + ' cannot be found!', null, 404);
        }
        const entity = await user_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'User retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
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
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await user_service.exists(id);
        if (!exists) {
            throw new ApiError('User with id ' + id.toString() + ' cannot be found!', null, 404);
            
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
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await user_service.exists(id);
        if (!exists) {
            throw new ApiError('User with id ' + id.toString() + ' cannot be found!', null, 404);
            
        }
        var result = await user_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'User deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        
        const deleted_entities = await user_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Users retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.generate_otp = async (req, res) => {
    try {
        req.context="user.generate_otp";
        var phone = (typeof req.body.phone != 'undefined') ? req.body.phone : null;
        const user_name = (typeof req.body.user_name != 'undefined') ? req.body.user_name : null;
        const user_id = (typeof req.body.user_id != 'undefined') ? req.body.user_id : null;
        phone = helper.sanitize_phonenumber(phone);

        if (phone == null && user_id == null && user_name == null) {
            throw new ApiError('Phone, email or username must be provided!', null, 400);
            
        };
        var u = await user_service.generate_otp(phone, user_name, user_id);
        response_handler.set_success_response(res, req, 200, "Your OTP", { entity: u });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.login_with_otp = async (req, res) => {
    try {
        req.context="user.login_with_otp";
        var phone = (typeof req.body.phone != 'undefined') ? req.body.phone : null;
        const user_name = (typeof req.body.user_name != 'undefined') ? req.body.user_name : null;
        const user_id = (typeof req.body.user_id != 'undefined') ? req.body.user_id : null;
        const otp = (typeof req.body.otp != 'undefined') ? req.body.otp : null;

        phone = helper.sanitize_phonenumber(phone);

        if (phone == null && user_id == null && user_name == null) {
            throw new ApiError('Phone, email or username must be provided!', null, 400);
            
        };

        if (otp == null) {
            throw new ApiError('OTP is missing', null, 400);
        }
        var u = await user_service.login_with_otp(phone, user_name, user_id, otp);
        if (u == null) {
            throw new ApiError('User not found!', null, 404);
        };

        var user = u.user;
        var first_name = (user.first_name != null) ? user.first_name : '';
        var last_name = (user.last_name != null) ? user.last_name : '';
        var name = first_name + ' ' + last_name;
        var message = 'User \'' + name + '\' logged in successfully!';
        response_handler.set_success_response(res, req, 200, message, { entity: u });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.login_with_password = async (req, res) => {
    try {
        req.context="user.login_with_password";
        var phone = (typeof req.body.phone != 'undefined') ? req.body.phone : null;
        const email = (typeof req.body.email != 'undefined') ? req.body.email : null;
        const user_name = (typeof req.body.user_name != 'undefined') ? req.body.user_name : null;
        const password = (typeof req.body.password != 'undefined') ? req.body.password : null;

        phone = helper.sanitize_phonenumber(phone);
        if (phone == null && email == null && user_name == null) {
            throw new ApiError('Phone, email or username must be provided!', null, 400);
            
        }

        if (password == null) {
            throw new ApiError('Password must be provided!', null, 400);
            
        }
        var u = await user_service.login(phone, email, user_name, password);
        if (u == null) {
            throw new ApiError('User not found!', null, 400);
            
        }
        var user = u.user;
        var first_name = (user.first_name != null) ? user.first_name : '';
        var last_name = (user.last_name != null) ? user.last_name : '';
        var name = first_name + ' ' + last_name;
        var message = 'User \'' + name + '\' logged in successfully!';
        response_handler.set_success_response(res, req, 200, message, { entity: u }, false);
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.change_password = async (req, res) => {
    try {
        if (!req.body.new_password) {
            throw new ApiError('Missing required parameters.', null, 422);
        }
        const changed = await user_service.change_password(req.user, req.body.previous_password, req.body.new_password);
        if (!changed) {
            throw new ApiError('Problems encountered in updating the password!', null, 400);
        }
        response_handler.set_success_response(res, req, 201, 'Password updated successfully!', null);
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.upload_profile_picture = async (req, res, next) => {
    try {
        let sampleFile;
        let uploadPath;
        if (!req.files || Object.keys(req.files).length === 0) {
            //return res.status(400).send('No files were uploaded.');
            throw new ApiError('No files were uploaded.', null, 404);
            
        }
        // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
        sampleFile = req.files.sampleFile;
        let renameFile = req.user.user_name + "_" + Date.now() + path.extname(sampleFile.name)
        console.log(renameFile);
        uploadPath = __dirname + '/../upload/' + renameFile;
        // Use the mv() method to place the file somewhere on your server
        sampleFile.mv(uploadPath, async function (err) {
            if (err)
                return res.status(500).send(err);
            //res.send("File uploaded successfuly");
            let update_details={};
            update_details.profile_picture=renameFile; 
            var updated = await user_service.update(req.user.user_id, update_details);
            if (updated != null) {
                response_handler.set_success_response(res, req, 201, 'Profile picture uploaded successfully', {entity:updated});
                return;
            }
        });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}


///////////////////////////////////////////////////////////////////////////////////
//Authorization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.authorize_search = async (req, res, next) => {
    try {
        req.context = 'user.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try {
        req.context = 'user.get_by_id';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_access_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied', 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.authorize_update = async (req, res, next) => {
    try {
        req.context = 'user.update';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied', 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.authorize_delete = async (req, res, next) => {
    try {
        req.context = 'user.delete';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_delete_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.authorize_change_password = async (req, res, next) => {
    try {
        req.context = 'user.change_password';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', 403);
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
        await body('prefix').exists().isLength({ min: 1 }).trim().escape().run(req);
        await body('first_name').exists().isAlpha().isLength({ min: 1 }).trim().escape().run(req);
        await body('last_name').exists().isAlpha().isLength({ min: 1 }).trim().escape().run(req);
        await body('phone').isMobilePhone().isLength({ min: 10 }).trim().escape().run(req);
        await body('email').normalizeEmail().isEmail().trim().escape().run(req);
        await body('password').trim().run(req);
        // await body('company_id').isUUID().run(req);
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
        await query('company_id').optional().isUUID().trim().escape().run(req);
        await query('name').optional().isAscii().trim().escape().run(req);
        await query('phone').optional().trim().escape().run(req);
        await query('email').optional().trim().escape().run(req);
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
        //await param('id').isUUID().run(req);
        await body('prefix').optional().isLength({ min: 1 }).trim().escape().run(req);
        await body('first_name').optional().isAscii().isLength({ min: 1 }).trim().escape().run(req);
        await body('last_name').optional().isAscii().isLength({ min: 1 }).trim().escape().run(req);
        await body('phone').optional().isAscii().isLength({ min: 10 }).trim().escape().run(req);
        await body('email').optional().normalizeEmail().isEmail().trim().escape().run(req);
        await body('birth_date').optional().trim().isDate().escape().run(req);
        //await body('company_id').optional().isUUID().run(req);
        const result = validationResult(req);
        //console.log(result);
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

exports.sanitize_change_password = async (req, res, next) => {
    try {
        await param('id').exists().isUUID().run(req);
        await body('current_password').exists().trim().run(req);
        await body('new_password').exists().trim().run(req);
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
