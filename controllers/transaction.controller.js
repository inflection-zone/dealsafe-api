const transaction_service = require('../services/transaction.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');

const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
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
        var filter = await get_search_filters(req);
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

async function get_search_filters(req) {
    var filter = {};
    var display_id = req.query.display_id ? req.query.display_id : null;
    if (display_id != null) {
        filter['display_id'] = display_id;
    }

    var transaction_reference_id = req.query.transaction_reference_id ? req.query.transaction_reference_id : null;
    if (transaction_reference_id != null) {
        filter['transaction_reference_id'] = transaction_reference_id;
    }

    var escrow_bank_reference_id = req.query.escrow_bank_reference_id ? req.query.escrow_bank_reference_id : null;
    if (escrow_bank_reference_id != null) {
        filter['escrow_bank_reference_id'] = escrow_bank_reference_id;
    }

    var contract_id = req.query.contract_id ? req.query.contract_id : null;
    if (contract_id != null) {
        filter['contract_id'] = contract_id;
    }

    var milestone_id = req.query.milestone_id ? req.query.milestone_id : null;
    if (milestone_id != null) {
        filter['milestone_id'] = milestone_id;
    }

    var paid_by_id = req.query.paid_by_id ? req.query.paid_by_id : null;
    if (paid_by_id != null) {
        filter['paid_by_id'] = paid_by_id;
    }

    var paid_to_id = req.query.paid_to_id ? req.query.paid_to_id : null;
    if (paid_to_id != null) {
        filter['paid_to_id'] = paid_to_id;
    }

    var pay_from_account_number = req.query.pay_from_account_number ? req.query.pay_from_account_number : null;
    if (pay_from_account_number != null) {
        filter['pay_from_account_number'] = pay_from_account_number;
    }

    var pay_to_account_number = req.query.pay_to_account_number ? req.query.pay_to_account_number : null;
    if (pay_to_account_number != null) {
        filter['pay_to_account_number'] = pay_to_account_number;
    }

    var transaction_date = req.query.transaction_date ? req.query.transaction_date : null;
    if (transaction_date != null) {
        filter['transaction_date'] = transaction_date;
    }

    var transaction_status = req.query.transaction_status ? req.query.transaction_status : null;
    if (transaction_status != null) {
        filter['transaction_status'] = transaction_date;
    }
    
    var sort_type = req.query.sort_type ? req.query.sort_type : 'descending';
    var sort_by = req.query.sort_by ? req.query.sort_by : 'transaction_date';
    filter['sort_type'] = sort_type;
    filter['sort_by'] = sort_by;

    var page_number = req.query.page_number ? req.query.page_number : 1;
    var items_per_page = req.query.items_per_page ? req.query.items_per_page : 10;
    filter['page_number'] = page_number;
    filter['items_per_page'] = items_per_page;

    return filter;
}