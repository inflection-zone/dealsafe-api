const bank_account_details_service = require('../services/bank_account_details.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');

const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('bank_account_details.create', req, res)) {
            return;
        }
        if (!req.body.is_company_account || 
            !req.body.account_number || 
            !req.body.account_name || 
            !req.body.account_type || 
            !req.body.PAN) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
        const entity = await bank_account_details_service.create(req.body);
        response_handler.set_success_response(res, req, 201, 'BankAccountDetails added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('bank_account_details.search', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await bank_account_details_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Bank account details retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('bank_account_details.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await bank_account_details_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'BankAccountDetails with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await bank_account_details_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'BankAccountDetails retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('bank_account_details.update', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await bank_account_details_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'BankAccountDetails with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await bank_account_details_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'BankAccountDetails updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('BankAccountDetails cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('bank_account_details.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await bank_account_details_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'BankAccountDetails with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await bank_account_details_service.delete(id);
       response_handler.set_success_response(res, req, 200, 'BankAccountDetails deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('bank_account_details.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await bank_account_details_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Bank account details retrieved successfully!', {
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