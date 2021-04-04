const address_service = require('../services/address.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');

exports.create = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('address.create', req, res)) {
            return;
        }
        if (!req.body.address || !req.body.city) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
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
        if (!await authorization_handler.check_role_authorization('address.search', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await address_service.search(filter);
        activity_handler.record_activity(req.user, 'address.search', req, res, 'Address');
        response_handler.set_success_response(res, req, 200, 'Addresses retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'address.search', req, res, 'Address', error);
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('address.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await address_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Address with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await address_service.get_by_id(id);
        activity_handler.record_activity(req.user, 'address.get_by_id', req, res, 'Address');
        response_handler.set_success_response(res, req, 200, 'Address retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'address.get_by_id', req, res, 'Address', error);
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('address.update', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await address_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Address with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await address_service.update(id, req.body);
        if (updated != null) {
            activity_handler.record_activity(req.user, 'address.update', req, res, 'Address');
            response_handler.set_success_response(res, req, 200, 'Address updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Address cannot be updated!');
    } catch (error) {
        activity_handler.record_activity(req.user, 'address.update', req, res, 'Address', error);
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('address.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await address_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Address with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await address_service.delete(id);
        activity_handler.record_activity(req.user, 'address.delete', req, res, 'Address');
        response_handler.set_success_response(res, req, 200, 'Address deleted successfully!', result);
    } catch (error) {
        activity_handler.record_activity(req.user, 'address.delete', req, res, 'Address', error);
        response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('address.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await address_service.get_deleted(req.user);
        activity_handler.record_activity(req.user, 'address.get_deleted', req, res, 'Address');
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Addresses retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'address.get_deleted', req, res, 'Address', error);
        response_handler.handle_error(error, res, req);
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