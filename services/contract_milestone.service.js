'use strict';

const db = require('../database/connection');
const ContractMilestone = require('../database/models/ContractMilestone').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (requestBody) => {
    try {
        var entity = get_entity_to_save(requestBody)
        var record = await ContractMilestone.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while creating contract_milestone instance!';
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
        var records = await ContractMilestone.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while retrieving contract_milestone instances!';
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
        var record = await ContractMilestone.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while retrieving contract_milestone by id!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.update = async (id, requestBody) => {

    try {
        let updates = get_updates(requestBody);
        var res = await ContractMilestone.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new Error('Unable to update contract_milestone!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await ContractMilestone.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while updating contract_milestone!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.delete = async (id) => {
    try {
        var res = await ContractMilestone.update({
            is_active: false
        }, {
            where: {
                id: id
            }
        });
        return res.length == 1;
    } catch (error) {
        var msg = 'Problem encountered while deleting contract_milestone!';
        error_handler.throw_service_error(error, msg);
    }
}
module.exports.get_deleted = async () => {
    try {
        var records = await ContractMilestone.findAll({
            where: {
                is_active: false
            }
        });
        for (var record of records) {
            objects.push(get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while deleted instances of contract_milestone!';
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
        var record = await ContractMilestone.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of contract_milestone with id ' + id.toString() + '!';
        error_handler.throw_service_error(error, msg);
    }
}

function get_entity_to_save(requestBody) {
    return {
        display_id: requestBody.display_id ? requestBody.display_id : null,
        contract_id: requestBody.contract_id ? requestBody.contract_id : null,
        milestone_index: requestBody.milestone_index ? requestBody.milestone_index : 1,
        name: requestBody.name ? requestBody.name : null,
        description: requestBody.description ? requestBody.description : null,
        created_date: requestBody.created_date ? requestBody.created_date : null,
        execution_planned_start_date: requestBody.execution_planned_start_date ? requestBody.execution_planned_start_date : null,
        execution_planned_end_date: requestBody.execution_planned_end_date ? requestBody.execution_planned_end_date : null,
        execution_actual_start_date: requestBody.execution_actual_start_date ? requestBody.execution_actual_start_date : null,
        execution_actual_end_date: requestBody.execution_actual_end_date ? requestBody.execution_actual_end_date : null,
        milestone_amount: requestBody.milestone_amount ? requestBody.milestone_amount : null,
        current_status: requestBody.current_status ? requestBody.current_status : 1,
        is_cancelled: requestBody.is_cancelled ? requestBody.is_cancelled : false,
        is_closed: requestBody.is_closed ? requestBody.is_closed : false,
        transaction_id: requestBody.transaction_id ? requestBody.transaction_id : null
    };
}

function get_updates(requestBody) {
    let updates = {};
    if (requestBody.hasOwnProperty('display_id')) {
        updates.display_id = requestBody.display_id;
    }
    if (requestBody.hasOwnProperty('contract_id')) {
        updates.contract_id = requestBody.contract_id;
    }
    if (requestBody.hasOwnProperty('milestone_index')) {
        updates.milestone_index = requestBody.milestone_index;
    }
    if (requestBody.hasOwnProperty('name')) {
        updates.name = requestBody.name;
    }
    if (requestBody.hasOwnProperty('description')) {
        updates.description = requestBody.description;
    }
    if (requestBody.hasOwnProperty('created_date')) {
        updates.created_date = requestBody.created_date;
    }
    if (requestBody.hasOwnProperty('execution_planned_start_date')) {
        updates.execution_planned_start_date = requestBody.execution_planned_start_date;
    }
    if (requestBody.hasOwnProperty('execution_planned_end_date')) {
        updates.execution_planned_end_date = requestBody.execution_planned_end_date;
    }
    if (requestBody.hasOwnProperty('execution_actual_start_date')) {
        updates.execution_actual_start_date = requestBody.execution_actual_start_date;
    }
    if (requestBody.hasOwnProperty('execution_actual_end_date')) {
        updates.execution_actual_end_date = requestBody.execution_actual_end_date;
    }
    if (requestBody.hasOwnProperty('milestone_amount')) {
        updates.milestone_amount = requestBody.milestone_amount;
    }
    if (requestBody.hasOwnProperty('current_status')) {
        updates.current_status = requestBody.current_status;
    }
    if (requestBody.hasOwnProperty('is_cancelled')) {
        updates.is_cancelled = requestBody.is_cancelled;
    }
    if (requestBody.hasOwnProperty('is_closed')) {
        updates.is_closed = requestBody.is_closed;
    }
    if (requestBody.hasOwnProperty('transaction_id')) {
        updates.transaction_id = requestBody.transaction_id;
    }
    return updates;
}

function get_object_to_send(record) {
    if (record == null) {
        return null;
    }
    return {
        id: record.id,
        display_id: record.display_id,
        contract_id: record.contract_id,
        milestone_index: record.milestone_index,
        name: record.name,
        description: record.description,
        created_date: record.created_date,
        execution_planned_start_date: record.execution_planned_start_date,
        execution_planned_end_date: record.execution_planned_end_date,
        execution_actual_start_date: record.execution_actual_start_date,
        execution_actual_end_date: record.execution_actual_end_date,
        milestone_amount: record.milestone_amount,
        current_status: record.current_status,
        is_cancelled: record.is_cancelled,
        is_closed: record.is_closed,
        transaction_id: record.transaction_id
    };
}