const contract_service = require('../services/contract.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const activity_handler = require('../common/activity_handler');

exports.create = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('contract.create', req, res)) {
            return;
        }
        if (!req.body.display_id || !req.body.contract_type || !req.body.name || !req.body.is_full_payment_contract || !req.body.created_date || !req.body.has_buyer_deposited_amount || !req.body.has_seller_deposited_amount || !req.body.current_status || !req.body.is_cancelled || !req.body.is_closed || !req.body.created_by) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
        const entity = await contract_service.create(req.body);
        activity_handler.record_activity(req.user, 'contract.create', req, res, 'Contract');
        response_handler.set_success_response(res, 201, 'Contract added successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'contract.create', req, res, 'Contract', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_all = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('contract.get_all', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await contract_service.get_all(filter);
        activity_handler.record_activity(req.user, 'contract.get_all', req, res, 'Contract');
        response_handler.set_success_response(res, 200, 'Contracts retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'contract.get_all', req, res, 'Contract', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('contract.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await contract_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Contract with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await contract_service.get_by_id(id);
        activity_handler.record_activity(req.user, 'contract.get_by_id', req, res, 'Contract');
        response_handler.set_success_response(res, 200, 'Contract retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'contract.get_by_id', req, res, 'Contract', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('contract.update', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await contract_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Contract with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await contract_service.update(id, req.body);
        if (updated != null) {
            activity_handler.record_activity(req.user, 'contract.update', req, res, 'Contract');
            response_handler.set_success_response(res, 200, 'Contract updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Contract cannot be updated!');
    } catch (error) {
        activity_handler.record_activity(req.user, 'contract.update', req, res, 'Contract', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('contract.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await contract_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Contract with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await contract_service.delete(id);
        activity_handler.record_activity(req.user, 'contract.delete', req, res, 'Contract');
        response_handler.set_success_response(res, 200, 'Contract deleted successfully!', result);
    } catch (error) {
        activity_handler.record_activity(req.user, 'contract.delete', req, res, 'Contract', error);
        error_handler.handle_controller_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('contract.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await contract_service.get_deleted(req.user);
        activity_handler.record_activity(req.user, 'contract.get_deleted', req, res, 'Contract');
        response_handler.set_success_response(res, 200, 'Deleted instances of Contracts retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'contract.get_deleted', req, res, 'Contract', error);
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