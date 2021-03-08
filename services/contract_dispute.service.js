'use strict';

const db = require('../database/connection');
const ContractDispute = require('../database/models/ContractDispute').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (requestBody) => {
    try {
        var entity = get_entity_to_save(requestBody)
        var record = await ContractDispute.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while creating contract_dispute instance!';
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
        var records = await ContractDispute.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while retrieving contract_dispute instances!';
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
        var record = await ContractDispute.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while retrieving contract_dispute by id!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.update = async (id, requestBody) => {

    try {
        let updates = get_updates(requestBody);
        var res = await ContractDispute.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new Error('Unable to update contract_dispute!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await ContractDispute.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while updating contract_dispute!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.delete = async (id) => {
    try {
        var res = await ContractDispute.update({
            is_active: false
        }, {
            where: {
                id: id
            }
        });
        return res.length == 1;
    } catch (error) {
        var msg = 'Problem encountered while deleting contract_dispute!';
        error_handler.throw_service_error(error, msg);
    }
}
module.exports.get_deleted = async () => {
    try {
        var records = await ContractDispute.findAll({
            where: {
                is_active: false
            }
        });
        for (var record of records) {
            objects.push(get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while deleted instances of contract_dispute!';
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
        var record = await ContractDispute.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of contract_dispute with id ' + id.toString() + '!';
        error_handler.throw_service_error(error, msg);
    }
}

function get_entity_to_save(requestBody) {
    return {
        contract_id: requestBody.contract_id ? requestBody.contract_id : null,
        milestone_id: requestBody.milestone_id ? requestBody.milestone_id : null,
        reason: requestBody.reason ? requestBody.reason : null,
        raised_by: requestBody.raised_by ? requestBody.raised_by : null,
        raised_date: requestBody.raised_date ? requestBody.raised_date : null,
        resolution_date: requestBody.resolution_date ? requestBody.resolution_date : null,
        is_resolved: requestBody.is_resolved ? requestBody.is_resolved : false,
        resolution_dates: requestBody.resolution_dates ? requestBody.resolution_dates : null,
        is_blocking: requestBody.is_blocking ? requestBody.is_blocking : true,
        arbitrator_user_id: requestBody.arbitrator_user_id ? requestBody.arbitrator_user_id : null
    };
}

function get_updates(requestBody) {
    let updates = {};
    if (requestBody.hasOwnProperty('contract_id')) {
        updates.contract_id = requestBody.contract_id;
    }
    if (requestBody.hasOwnProperty('milestone_id')) {
        updates.milestone_id = requestBody.milestone_id;
    }
    if (requestBody.hasOwnProperty('reason')) {
        updates.reason = requestBody.reason;
    }
    if (requestBody.hasOwnProperty('raised_by')) {
        updates.raised_by = requestBody.raised_by;
    }
    if (requestBody.hasOwnProperty('raised_date')) {
        updates.raised_date = requestBody.raised_date;
    }
    if (requestBody.hasOwnProperty('resolution_date')) {
        updates.resolution_date = requestBody.resolution_date;
    }
    if (requestBody.hasOwnProperty('is_resolved')) {
        updates.is_resolved = requestBody.is_resolved;
    }
    if (requestBody.hasOwnProperty('resolution_dates')) {
        updates.resolution_dates = requestBody.resolution_dates;
    }
    if (requestBody.hasOwnProperty('is_blocking')) {
        updates.is_blocking = requestBody.is_blocking;
    }
    if (requestBody.hasOwnProperty('arbitrator_user_id')) {
        updates.arbitrator_user_id = requestBody.arbitrator_user_id;
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
        reason: record.reason,
        raised_by: record.raised_by,
        raised_date: record.raised_date,
        resolution_date: record.resolution_date,
        is_resolved: record.is_resolved,
        resolution_dates: record.resolution_dates,
        is_blocking: record.is_blocking,
        arbitrator_user_id: record.arbitrator_user_id
    };
}