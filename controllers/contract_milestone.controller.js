const contract_milestone_service = require('../services/contract_milestone.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');

const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract_milestone.create', req, res)) {
            return;
        }
        if (!req.body.display_id || !req.body.contract_id || !req.body.milestone_index || !req.body.name || !req.body.created_date || !req.body.current_status || !req.body.is_cancelled || !req.body.is_closed) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
        const entity = await contract_milestone_service.create(req.body);
        response_handler.set_success_response(res, req, 201, 'ContractMilestone added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract_milestone.search', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await contract_milestone_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Contract milestones retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract_milestone.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await contract_milestone_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'ContractMilestone with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await contract_milestone_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'ContractMilestone retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract_milestone.update', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await contract_milestone_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'ContractMilestone with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await contract_milestone_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'ContractMilestone updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('ContractMilestone cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract_milestone.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await contract_milestone_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'ContractMilestone with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await contract_milestone_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'ContractMilestone deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract_milestone.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await contract_milestone_service.get_deleted(req.user);
       response_handler.set_success_response(res, req, 200, 'Deleted instances of Contract milestones retrieved successfully!', {
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