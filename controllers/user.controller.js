const user_service = require('../services/user.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const activity_handler = require('../common/activity_handler');

exports.create = async (req, res) => {
    try {
        // if (!await authorization_handler.is_authorized('user.create', req, res)) {
        //     return;
        // }
        if (
            !req.body.first_name || 
            !req.body.last_name || 
            !req.body.prefix ||
            !req.body.password) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
        const entity = await user_service.create(req.body);
        activity_handler.record_activity(req.user, 'user.create', req, res, 'User');
        response_handler.set_success_response(res, 201, 'User added successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'user.create', req, res, 'User', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_all = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('user.get_all', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await user_service.get_all(filter);
        activity_handler.record_activity(req.user, 'user.get_all', req, res, 'User');
        response_handler.set_success_response(res, 200, 'Users retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'user.get_all', req, res, 'User', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('user.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await user_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'User with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await user_service.get_by_id(id);
        activity_handler.record_activity(req.user, 'user.get_by_id', req, res, 'User');
        response_handler.set_success_response(res, 200, 'User retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'user.get_by_id', req, res, 'User', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_by_display_id = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('user.get_by_display_id', req, res)) {
            return;
        }
        var displayId = req.params.displayId;
        const entity = await user_service.get_by_display_id(displayId);
        if (entity == null) {
            res.statusCode = 404;
            throw new Error('User with display id ' + displayId.toString() + ' cannot be found!');
        }
        activity_handler.record_activity(req.user, 'user.get_by_display_id', req, res, 'User');
        response_handler.set_success_response(res, 200, 'User retrieved successfully!', { entity: entity });
    }
    catch (error) {
        activity_handler.record_activity(req.user, 'user.get_by_display_id', req, res, 'User', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('user.update', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await user_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'User with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await user_service.update(id, req.body);
        if (updated != null) {
            activity_handler.record_activity(req.user, 'user.update', req, res, 'User');
            response_handler.set_success_response(res, 200, 'User updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('User cannot be updated!');
    } catch (error) {
        activity_handler.record_activity(req.user, 'user.update', req, res, 'User', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('user.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await user_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'User with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await user_service.delete(id);
        activity_handler.record_activity(req.user, 'user.delete', req, res, 'User');
        response_handler.set_success_response(res, 200, 'User deleted successfully!', result);
    } catch (error) {
        activity_handler.record_activity(req.user, 'user.delete', req, res, 'User', error);
        error_handler.handle_controller_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('user.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await user_service.get_deleted(req.user);
        activity_handler.record_activity(req.user, 'user.get_deleted', req, res, 'User');
        response_handler.set_success_response(res, 200, 'Deleted instances of Users retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'user.get_deleted', req, res, 'User', error);
        error_handler.handle_controller_error(error, res, req);
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
        response_handler.set_success_response(res, 200, "Your OTP", { entity: u });
    }
    catch (error){
        error_handler.handle_controller_error(error, res, req);
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
        response_handler.set_success_response(res, 200, message, { entity: u });
    }
    catch (error){
        error_handler.handle_controller_error(error, res, req);
    }
}

exports.login = async (req, res) => {
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
        response_handler.set_success_response(res, 200, message, { entity: u }, false);
    }
    catch (error) {
        error_handler.handle_controller_error(error, res, req);
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
        activity_handler.record_activity(req.user, 'user.change_password', req, res, 'User');
        response_handler.set_success_response(res, 201, 'Password updated successfully!', null);
    }
    catch (error) {
        activity_handler.record_activity(req.user, 'user.change_password', req, res, 'User', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

function get_search_filters(req) {
    var filter = {};
    //var name = req.query.name ? req.query.name : null;
    // if (name != null) {
    //     filter['name'] = name;
    // }
    return filter;
}