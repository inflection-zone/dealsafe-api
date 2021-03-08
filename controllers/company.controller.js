const company_service = require('../services/company.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const activity_handler = require('../common/activity_handler');

exports.create = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('company.create', req, res)) {
            return;
        }
        if (!req.body.display_id || !req.body.name || !req.body.contact_number || !req.body.tan || !req.body.subscription_type) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
        const entity = await company_service.create(req.body);
        activity_handler.record_activity(req.user, 'company.create', req, res, 'Company');
        response_handler.set_success_response(res, 201, 'Company added successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'company.create', req, res, 'Company', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_all = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('company.get_all', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await company_service.get_all(filter);
        activity_handler.record_activity(req.user, 'company.get_all', req, res, 'Company');
        response_handler.set_success_response(res, 200, 'Companies retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'company.get_all', req, res, 'Company', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('company.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await company_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Company with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await company_service.get_by_id(id);
        activity_handler.record_activity(req.user, 'company.get_by_id', req, res, 'Company');
        response_handler.set_success_response(res, 200, 'Company retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'company.get_by_id', req, res, 'Company', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('company.update', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await company_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Company with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await company_service.update(id, req.body);
        if (updated != null) {
            activity_handler.record_activity(req.user, 'company.update', req, res, 'Company');
            response_handler.set_success_response(res, 200, 'Company updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Company cannot be updated!');
    } catch (error) {
        activity_handler.record_activity(req.user, 'company.update', req, res, 'Company', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('company.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await company_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Company with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await company_service.delete(id);
        activity_handler.record_activity(req.user, 'company.delete', req, res, 'Company');
        response_handler.set_success_response(res, 200, 'Company deleted successfully!', result);
    } catch (error) {
        activity_handler.record_activity(req.user, 'company.delete', req, res, 'Company', error);
        error_handler.handle_controller_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('company.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await company_service.get_deleted(req.user);
        activity_handler.record_activity(req.user, 'company.get_deleted', req, res, 'Company');
        response_handler.set_success_response(res, 200, 'Deleted instances of Companies retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'company.get_deleted', req, res, 'Company', error);
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