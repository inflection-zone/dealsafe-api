'use strict';

const db = require('../database/connection');
const ContractDispute = require('../database/models/ContractDispute').Model;
const helper = require('../common/helper');
const { ApiError } = require('../common/api_error');
const logger = require('../common/logger');

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
        var record = await ContractDispute.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        throw(error);
    }
}

module.exports.search = async (filter) => {
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
        throw(error);
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
        throw(error);
    }
}

module.exports.update = async (id, request_body) => {

    try {
        let updates = get_updates(request_body);
        var res = await ContractDispute.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new ApiError('Unable to update contract_dispute!');
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
        throw(error);
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
        throw(error);
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
        throw(error);
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
        throw(error);
    }
}

function get_entity_to_save(request_body) {
    return {
        contract_id: request_body.contract_id ? request_body.contract_id : null,
        milestone_id: request_body.milestone_id ? request_body.milestone_id : null,
        reason: request_body.reason ? request_body.reason : null,
        raised_by: request_body.raised_by ? request_body.raised_by : null,
        raised_date: request_body.raised_date ? request_body.raised_date : null,
        resolution_date: request_body.resolution_date ? request_body.resolution_date : null,
        is_resolved: request_body.is_resolved ? request_body.is_resolved : false,
        resolution_dates: request_body.resolution_dates ? request_body.resolution_dates : null,
        is_blocking: request_body.is_blocking ? request_body.is_blocking : true,
        arbitrator_user_id: request_body.arbitrator_user_id ? request_body.arbitrator_user_id : null
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
    if (request_body.hasOwnProperty('reason')) {
        updates.reason = request_body.reason;
    }
    if (request_body.hasOwnProperty('raised_by')) {
        updates.raised_by = request_body.raised_by;
    }
    if (request_body.hasOwnProperty('raised_date')) {
        updates.raised_date = request_body.raised_date;
    }
    if (request_body.hasOwnProperty('resolution_date')) {
        updates.resolution_date = request_body.resolution_date;
    }
    if (request_body.hasOwnProperty('is_resolved')) {
        updates.is_resolved = request_body.is_resolved;
    }
    if (request_body.hasOwnProperty('resolution_dates')) {
        updates.resolution_dates = request_body.resolution_dates;
    }
    if (request_body.hasOwnProperty('is_blocking')) {
        updates.is_blocking = request_body.is_blocking;
    }
    if (request_body.hasOwnProperty('arbitrator_user_id')) {
        updates.arbitrator_user_id = request_body.arbitrator_user_id;
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