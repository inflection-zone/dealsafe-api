const transaction_service = require('../services/transaction.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const activity_handler = require('../common/activity_handler');

exports.create = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('transaction.create', req, res)) {
            return;
        }
        if (!req.body.display_id || !req.body.transaction_reference_id || !req.body.contract_id || !req.body.paid_by_id || !req.body.paid_to_id || !req.body.transaction_amount || !req.body.transaction_date || !req.body.currency || !req.body.transaction_status) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
        const entity = await transaction_service.create(req.body);
        activity_handler.record_activity(req.user, 'transaction.create', req, res, 'Transaction');
        response_handler.set_success_response(res, 201, 'Transaction added successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'transaction.create', req, res, 'Transaction', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_all = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('transaction.get_all', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await transaction_service.get_all(filter);
        activity_handler.record_activity(req.user, 'transaction.get_all', req, res, 'Transaction');
        response_handler.set_success_response(res, 200, 'Transactions retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'transaction.get_all', req, res, 'Transaction', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('transaction.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await transaction_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Transaction with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await transaction_service.get_by_id(id);
        activity_handler.record_activity(req.user, 'transaction.get_by_id', req, res, 'Transaction');
        response_handler.set_success_response(res, 200, 'Transaction retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'transaction.get_by_id', req, res, 'Transaction', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('transaction.update', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await transaction_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Transaction with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await transaction_service.update(id, req.body);
        if (updated != null) {
            activity_handler.record_activity(req.user, 'transaction.update', req, res, 'Transaction');
            response_handler.set_success_response(res, 200, 'Transaction updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Transaction cannot be updated!');
    } catch (error) {
        activity_handler.record_activity(req.user, 'transaction.update', req, res, 'Transaction', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('transaction.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await transaction_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Transaction with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await transaction_service.delete(id);
        activity_handler.record_activity(req.user, 'transaction.delete', req, res, 'Transaction');
        response_handler.set_success_response(res, 200, 'Transaction deleted successfully!', result);
    } catch (error) {
        activity_handler.record_activity(req.user, 'transaction.delete', req, res, 'Transaction', error);
        error_handler.handle_controller_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('transaction.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await transaction_service.get_deleted(req.user);
        activity_handler.record_activity(req.user, 'transaction.get_deleted', req, res, 'Transaction');
        response_handler.set_success_response(res, 200, 'Deleted instances of Transactions retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'transaction.get_deleted', req, res, 'Transaction', error);
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