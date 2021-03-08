const agreement_clause_service = require('../services/agreement_clause.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const activity_handler = require('../common/activity_handler');

exports.create = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('agreement_clause.create', req, res)) {
            return;
        }
        if (!req.body.contract_id || !req.body.text) {
            response_handler.set_failure_response(res, 200, 'Missing required parameters.', req);
            return;
        }
        const entity = await agreement_clause_service.create(req.body);
        activity_handler.record_activity(req.user, 'agreement_clause.create', req, res, 'AgreementClause');
        response_handler.set_success_response(res, 201, 'AgreementClause added successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'agreement_clause.create', req, res, 'AgreementClause', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_all = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('agreement_clause.get_all', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await agreement_clause_service.get_all(filter);
        activity_handler.record_activity(req.user, 'agreement_clause.get_all', req, res, 'AgreementClause');
        response_handler.set_success_response(res, 200, 'Agreement clauses retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'agreement_clause.get_all', req, res, 'AgreementClause', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('agreement_clause.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await agreement_clause_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'AgreementClause with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await agreement_clause_service.get_by_id(id);
        activity_handler.record_activity(req.user, 'agreement_clause.get_by_id', req, res, 'AgreementClause');
        response_handler.set_success_response(res, 200, 'AgreementClause retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'agreement_clause.get_by_id', req, res, 'AgreementClause', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('agreement_clause.update', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await agreement_clause_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'AgreementClause with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await agreement_clause_service.update(id, req.body);
        if (updated != null) {
            activity_handler.record_activity(req.user, 'agreement_clause.update', req, res, 'AgreementClause');
            response_handler.set_success_response(res, 200, 'AgreementClause updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('AgreementClause cannot be updated!');
    } catch (error) {
        activity_handler.record_activity(req.user, 'agreement_clause.update', req, res, 'AgreementClause', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('agreement_clause.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await agreement_clause_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'AgreementClause with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await agreement_clause_service.delete(id);
        activity_handler.record_activity(req.user, 'agreement_clause.delete', req, res, 'AgreementClause');
        response_handler.set_success_response(res, 200, 'AgreementClause deleted successfully!', result);
    } catch (error) {
        activity_handler.record_activity(req.user, 'agreement_clause.delete', req, res, 'AgreementClause', error);
        error_handler.handle_controller_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    try {
        if (!await authorization_handler.is_authorized('agreement_clause.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await agreement_clause_service.get_deleted(req.user);
        activity_handler.record_activity(req.user, 'agreement_clause.get_deleted', req, res, 'AgreementClause');
        response_handler.set_success_response(res, 200, 'Deleted instances of Agreement clauses retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'agreement_clause.get_deleted', req, res, 'AgreementClause', error);
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