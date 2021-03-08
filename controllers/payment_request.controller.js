const payment_request_service = require('../services/payment_request.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const activity_handler = require('../common/activity_handler');

exports.create = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('payment_request.create', req, res)) {
            return;
        }
        if (!req.body.display_id || !req.body.contract_id || !req.body.requested_by_user_id || !req.body.amount || !req.body.request_date || !req.body.transaction_reference_id) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
        const entity = await payment_request_service.create(req.body);
        activity_handler.record_activity(req.user, 'payment_request.create', req, res, 'PaymentRequest');
        response_handler.set_success_response(res, 201, 'PaymentRequest added successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'payment_request.create', req, res, 'PaymentRequest', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_all = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('payment_request.get_all', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await payment_request_service.get_all(filter);
        activity_handler.record_activity(req.user, 'payment_request.get_all', req, res, 'PaymentRequest');
        response_handler.set_success_response(res, 200, 'Payment requests retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'payment_request.get_all', req, res, 'PaymentRequest', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('payment_request.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await payment_request_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'PaymentRequest with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await payment_request_service.get_by_id(id);
        activity_handler.record_activity(req.user, 'payment_request.get_by_id', req, res, 'PaymentRequest');
        response_handler.set_success_response(res, 200, 'PaymentRequest retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'payment_request.get_by_id', req, res, 'PaymentRequest', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('payment_request.update', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await payment_request_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'PaymentRequest with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await payment_request_service.update(id, req.body);
        if (updated != null) {
            activity_handler.record_activity(req.user, 'payment_request.update', req, res, 'PaymentRequest');
            response_handler.set_success_response(res, 200, 'PaymentRequest updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('PaymentRequest cannot be updated!');
    } catch (error) {
        activity_handler.record_activity(req.user, 'payment_request.update', req, res, 'PaymentRequest', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('payment_request.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await payment_request_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'PaymentRequest with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await payment_request_service.delete(id);
        activity_handler.record_activity(req.user, 'payment_request.delete', req, res, 'PaymentRequest');
        response_handler.set_success_response(res, 200, 'PaymentRequest deleted successfully!', result);
    } catch (error) {
        activity_handler.record_activity(req.user, 'payment_request.delete', req, res, 'PaymentRequest', error);
        error_handler.handle_controller_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('payment_request.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await payment_request_service.get_deleted(req.user);
        activity_handler.record_activity(req.user, 'payment_request.get_deleted', req, res, 'PaymentRequest');
        response_handler.set_success_response(res, 200, 'Deleted instances of Payment requests retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'payment_request.get_deleted', req, res, 'PaymentRequest', error);
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