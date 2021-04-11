const contract_dispute_service = require('../services/contract_dispute.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');

const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract_dispute.create', req, res)) {
            return;
        }
        if (!req.body.contract_id || !req.body.reason || !req.body.raised_by || !req.body.raised_date || !req.body.is_resolved || !req.body.is_blocking) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
        const entity = await contract_dispute_service.create(req.body);
        response_handler.set_success_response(res, req, 201, 'ContractDispute added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract_dispute.search', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await contract_dispute_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Contract disputes retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract_dispute.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await contract_dispute_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'ContractDispute with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await contract_dispute_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'ContractDispute retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract_dispute.update', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await contract_dispute_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'ContractDispute with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await contract_dispute_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'ContractDispute updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('ContractDispute cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract_dispute.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await contract_dispute_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'ContractDispute with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await contract_dispute_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'ContractDispute deleted successfully!', result);
    } catch (error) {
       response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract_dispute.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await contract_dispute_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Contract disputes retrieved successfully!', {
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