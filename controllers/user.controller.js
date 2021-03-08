const user_service = require('../services/user.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const activity_handler = require('../common/activity_handler');

exports.create = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('user.create', req, res)) {
            return;
        }
        if (!req.body.display_id || !req.body.first_name || !req.body.last_name || !req.body.prefix || !req.body.password || !req.body.is_contact_person_for_organization) {
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

function get_search_filters(req) {
    var filter = {};
    //var name = req.query.name ? req.query.name : null;
    // if (name != null) {
    //     filter['name'] = name;
    // }
    return filter;
}