'use strict';

const db = require('../database/connection');
const AgreementClause = require('../database/models/AgreementClause').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
        var record = await AgreementClause.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while creating agreement_clause instance!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.get_all = async (filter) => {
    try {
        let objects = [];
        var search = {
            where: {
                is_active: true
            }
        };
        // if (filter.hasOwnProperty('name')) {
        //     search.where.name = { [Op.iLike]: '%' + filter.name + '%' };
        // }
        var records = await AgreementClause.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while retrieving agreement_clause instances!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.get_by_id = async (id) => {
    try {
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await AgreementClause.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while retrieving agreement_clause by id!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.update = async (id, request_body) => {

    try {
        let updates = get_updates(request_body);
        var res = await AgreementClause.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new Error('Unable to update agreement_clause!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await AgreementClause.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while updating agreement_clause!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.delete = async (id) => {
    try {
        var res = await AgreementClause.update({
            is_active: false
        }, {
            where: {
                id: id
            }
        });
        return res.length == 1;
    } catch (error) {
        var msg = 'Problem encountered while deleting agreement_clause!';
        error_handler.throw_service_error(error, msg);
    }
}
module.exports.get_deleted = async () => {
    try {
        var records = await AgreementClause.findAll({
            where: {
                is_active: false
            }
        });
        for (var record of records) {
            objects.push(get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while deleted instances of agreement_clause!';
        error_handler.throw_service_error(error, msg);
    }
}
module.exports.exists = async (id) => {
    try {
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await AgreementClause.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of agreement_clause with id ' + id.toString() + '!';
        error_handler.throw_service_error(error, msg);
    }
}

function get_entity_to_save(request_body) {
    return {
        contract_id: request_body.contract_id ? request_body.contract_id : null,
        milestone_id: request_body.milestone_id ? request_body.milestone_id : null,
        text: request_body.text ? request_body.text : null,
        added_by: request_body.added_by ? request_body.added_by : null
    };
}

function get_updates(request_body) {
    let updates = {};
    if (request_body.hasOwnProperty('contract_id')) {
        updates.contract_id = request_body.contract_id;
    }
    if (request_body.hasOwnProperty('milestone_id')) {
        updates.milestone_id = request_body.milestone_id;
    }
    if (request_body.hasOwnProperty('text')) {
        updates.text = request_body.text;
    }
    if (request_body.hasOwnProperty('added_by')) {
        updates.added_by = request_body.added_by;
    }
    return updates;
}

function get_object_to_send(record) {
    if (record == null) {
        return null;
    }
    return {
        id: record.id,
        contract_id: record.contract_id,
        milestone_id: record.milestone_id,
        text: record.text,
        added_by: record.added_by
    };
}