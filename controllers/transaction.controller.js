const transaction_service = require('../services/transaction.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const { ApiError } = require('../common/api_error');
const _ = require('lodash');
const { query, body, oneOf, validationResult, param } = require('express-validator');
////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('transaction.create', req, res)) {
            return;
        }
        if (!req.body.display_id || !req.body.transaction_reference_id || !req.body.contract_id || !req.body.paid_by_id || !req.body.paid_to_id || !req.body.transaction_amount || !req.body.transaction_date || !req.body.currency || !req.body.transaction_status) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
        const entity = await transaction_service.create(req.body);
        response_handler.set_success_response(res, req, 201, 'Transaction added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('transaction.search', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await transaction_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Transactions retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('transaction.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await transaction_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Transaction with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await transaction_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'Transaction retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('transaction.update', req, res)) {
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
            response_handler.set_success_response(res, req, 200, 'Transaction updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Transaction cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('transaction.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await transaction_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Transaction with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await transaction_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'Transaction deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('transaction.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await transaction_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Transactions retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
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