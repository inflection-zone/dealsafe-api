'use strict';

const db = require('../database/connection');
const ContractMilestone = require('../database/models/ContractMilestone').Model;
const helper = require('../common/helper');
const { ApiError } = require('../common/api_error');
const logger = require('../common/logger');

module.exports.create = async (request_body) => {
    try {
        var entity = await get_entity_to_save(request_body)
        var record = await ContractMilestone.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        throw (error);
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
        var records = await ContractMilestone.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        throw (error);
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
        throw (error);
    }
}

module.exports.update = async (id, request_body) => {

    try {
        let updates = get_updates(request_body);
        var res = await ContractMilestone.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new ApiError('Unable to update contract_milestone!', null, 403);
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
        throw (error);
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
        throw (error);
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
        throw (error);
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
        throw (error);
    }
}

async function get_entity_to_save(request_body) {
    var existing_milestones = await ContractMilestone.findAll({ where: { contract_id: request_body.contract_id } });
    var milestone_index = existing_milestones.length + 1;

    return {
        display_id: helper.generate_display_id(),
        contract_id: request_body.contract_id,
        milestone_index: milestone_index,
        name: request_body.name ? request_body.name : null,
        description: request_body.description ? request_body.description : null,
        created_date: Date.now(),
        execution_planned_start_date: request_body.execution_planned_start_date ? request_body.execution_planned_start_date : null,
        execution_planned_end_date: request_body.execution_planned_end_date ? request_body.execution_planned_end_date : null,
        milestone_amount: request_body.milestone_amount ? request_body.milestone_amount : null,
        current_status: request_body.current_status ? request_body.current_status : 1,
    };
}

function get_updates(request_body) {
    let updates = {};
    if (request_body.hasOwnProperty('display_id')) {
        updates.display_id = request_body.display_id;
    }
    if (request_body.hasOwnProperty('contract_id')) {
        updates.contract_id = request_body.contract_id;
    }
    if (request_body.hasOwnProperty('milestone_index')) {
        updates.milestone_index = request_body.milestone_index;
    }
    if (request_body.hasOwnProperty('name')) {
        updates.name = request_body.name;
    }
    if (request_body.hasOwnProperty('description')) {
        updates.description = request_body.description;
    }
    if (request_body.hasOwnProperty('created_date')) {
        updates.created_date = request_body.created_date;
    }
    if (request_body.hasOwnProperty('execution_planned_start_date')) {
        updates.execution_planned_start_date = request_body.execution_planned_start_date;
    }
    if (request_body.hasOwnProperty('execution_planned_end_date')) {
        updates.execution_planned_end_date = request_body.execution_planned_end_date;
    }
    if (request_body.hasOwnProperty('execution_actual_start_date')) {
        updates.execution_actual_start_date = request_body.execution_actual_start_date;
    }
    if (request_body.hasOwnProperty('execution_actual_end_date')) {
        updates.execution_actual_end_date = request_body.execution_actual_end_date;
    }
    if (request_body.hasOwnProperty('milestone_amount')) {
        updates.milestone_amount = request_body.milestone_amount;
    }
    if (request_body.hasOwnProperty('current_status')) {
        updates.current_status = request_body.current_status;
    }
    if (request_body.hasOwnProperty('is_cancelled')) {
        updates.is_cancelled = request_body.is_cancelled;
    }
    if (request_body.hasOwnProperty('is_closed')) {
        updates.is_closed = request_body.is_closed;
    }
    if (request_body.hasOwnProperty('transaction_id')) {
        updates.transaction_id = request_body.transaction_id;
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