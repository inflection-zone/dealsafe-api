'use strict';

const db = require('../database/connection');
const Contract = require('../database/models/Contract').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (requestBody) => {
    try {
        var entity = get_entity_to_save(requestBody)
        var record = await Contract.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while creating contract instance!';
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
        var records = await Contract.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while retrieving contract instances!';
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
        var record = await Contract.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while retrieving contract by id!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.update = async (id, requestBody) => {

    try {
        let updates = get_updates(requestBody);
        var res = await Contract.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new Error('Unable to update contract!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await Contract.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while updating contract!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.delete = async (id) => {
    try {
        var res = await Contract.update({
            is_active: false
        }, {
            where: {
                id: id
            }
        });
        return res.length == 1;
    } catch (error) {
        var msg = 'Problem encountered while deleting contract!';
        error_handler.throw_service_error(error, msg);
    }
}
module.exports.get_deleted = async () => {
    try {
        var records = await Contract.findAll({
            where: {
                is_active: false
            }
        });
        for (var record of records) {
            objects.push(get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while deleted instances of contract!';
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
        var record = await Contract.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of contract with id ' + id.toString() + '!';
        error_handler.throw_service_error(error, msg);
    }
}

function get_entity_to_save(requestBody) {
    return {
        display_id: requestBody.display_id ? requestBody.display_id : null,
        contract_type: requestBody.contract_type ? requestBody.contract_type : 1,
        name: requestBody.name ? requestBody.name : null,
        description: requestBody.description ? requestBody.description : null,
        is_full_payment_contract: requestBody.is_full_payment_contract ? requestBody.is_full_payment_contract : true,
        buyer_id: requestBody.buyer_id ? requestBody.buyer_id : null,
        buyer_contact_user_id: requestBody.buyer_contact_user_id ? requestBody.buyer_contact_user_id : null,
        seller_id: requestBody.seller_id ? requestBody.seller_id : null,
        seller_contact_user_id: requestBody.seller_contact_user_id ? requestBody.seller_contact_user_id : null,
        created_date: requestBody.created_date ? requestBody.created_date : null,
        buyer_agreed_date: requestBody.buyer_agreed_date ? requestBody.buyer_agreed_date : null,
        seller_agreed_date: requestBody.seller_agreed_date ? requestBody.seller_agreed_date : null,
        execution_planned_start_date: requestBody.execution_planned_start_date ? requestBody.execution_planned_start_date : null,
        execution_planned_end_date: requestBody.execution_planned_end_date ? requestBody.execution_planned_end_date : null,
        execution_actual_start_date: requestBody.execution_actual_start_date ? requestBody.execution_actual_start_date : null,
        execution_actual_end_date: requestBody.execution_actual_end_date ? requestBody.execution_actual_end_date : null,
        base_contract_amount: requestBody.base_contract_amount ? requestBody.base_contract_amount : null,
        tax_amount: requestBody.tax_amount ? requestBody.tax_amount : null,
        buyer_brokerage_amount: requestBody.buyer_brokerage_amount ? requestBody.buyer_brokerage_amount : null,
        seller_brokerage_amount: requestBody.seller_brokerage_amount ? requestBody.seller_brokerage_amount : null,
        has_buyer_deposited_amount: requestBody.has_buyer_deposited_amount ? requestBody.has_buyer_deposited_amount : false,
        has_seller_deposited_amount: requestBody.has_seller_deposited_amount ? requestBody.has_seller_deposited_amount : false,
        current_status: requestBody.current_status ? requestBody.current_status : 1,
        is_cancelled: requestBody.is_cancelled ? requestBody.is_cancelled : false,
        is_closed: requestBody.is_closed ? requestBody.is_closed : false,
        created_by: requestBody.created_by ? requestBody.created_by : null,
        arbitrator_user_id: requestBody.arbitrator_user_id ? requestBody.arbitrator_user_id : null
    };
}

function get_updates(requestBody) {
    let updates = {};
    if (requestBody.hasOwnProperty('display_id')) {
        updates.display_id = requestBody.display_id;
    }
    if (requestBody.hasOwnProperty('contract_type')) {
        updates.contract_type = requestBody.contract_type;
    }
    if (requestBody.hasOwnProperty('name')) {
        updates.name = requestBody.name;
    }
    if (requestBody.hasOwnProperty('description')) {
        updates.description = requestBody.description;
    }
    if (requestBody.hasOwnProperty('is_full_payment_contract')) {
        updates.is_full_payment_contract = requestBody.is_full_payment_contract;
    }
    if (requestBody.hasOwnProperty('buyer_id')) {
        updates.buyer_id = requestBody.buyer_id;
    }
    if (requestBody.hasOwnProperty('buyer_contact_user_id')) {
        updates.buyer_contact_user_id = requestBody.buyer_contact_user_id;
    }
    if (requestBody.hasOwnProperty('seller_id')) {
        updates.seller_id = requestBody.seller_id;
    }
    if (requestBody.hasOwnProperty('seller_contact_user_id')) {
        updates.seller_contact_user_id = requestBody.seller_contact_user_id;
    }
    if (requestBody.hasOwnProperty('created_date')) {
        updates.created_date = requestBody.created_date;
    }
    if (requestBody.hasOwnProperty('buyer_agreed_date')) {
        updates.buyer_agreed_date = requestBody.buyer_agreed_date;
    }
    if (requestBody.hasOwnProperty('seller_agreed_date')) {
        updates.seller_agreed_date = requestBody.seller_agreed_date;
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
    if (requestBody.hasOwnProperty('base_contract_amount')) {
        updates.base_contract_amount = requestBody.base_contract_amount;
    }
    if (requestBody.hasOwnProperty('tax_amount')) {
        updates.tax_amount = requestBody.tax_amount;
    }
    if (requestBody.hasOwnProperty('buyer_brokerage_amount')) {
        updates.buyer_brokerage_amount = requestBody.buyer_brokerage_amount;
    }
    if (requestBody.hasOwnProperty('seller_brokerage_amount')) {
        updates.seller_brokerage_amount = requestBody.seller_brokerage_amount;
    }
    if (requestBody.hasOwnProperty('has_buyer_deposited_amount')) {
        updates.has_buyer_deposited_amount = requestBody.has_buyer_deposited_amount;
    }
    if (requestBody.hasOwnProperty('has_seller_deposited_amount')) {
        updates.has_seller_deposited_amount = requestBody.has_seller_deposited_amount;
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
    if (requestBody.hasOwnProperty('created_by')) {
        updates.created_by = requestBody.created_by;
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
        display_id: record.display_id,
        contract_type: record.contract_type,
        name: record.name,
        description: record.description,
        is_full_payment_contract: record.is_full_payment_contract,
        buyer_id: record.buyer_id,
        buyer_contact_user_id: record.buyer_contact_user_id,
        seller_id: record.seller_id,
        seller_contact_user_id: record.seller_contact_user_id,
        created_date: record.created_date,
        buyer_agreed_date: record.buyer_agreed_date,
        seller_agreed_date: record.seller_agreed_date,
        execution_planned_start_date: record.execution_planned_start_date,
        execution_planned_end_date: record.execution_planned_end_date,
        execution_actual_start_date: record.execution_actual_start_date,
        execution_actual_end_date: record.execution_actual_end_date,
        base_contract_amount: record.base_contract_amount,
        tax_amount: record.tax_amount,
        buyer_brokerage_amount: record.buyer_brokerage_amount,
        seller_brokerage_amount: record.seller_brokerage_amount,
        has_buyer_deposited_amount: record.has_buyer_deposited_amount,
        has_seller_deposited_amount: record.has_seller_deposited_amount,
        current_status: record.current_status,
        is_cancelled: record.is_cancelled,
        is_closed: record.is_closed,
        created_by: record.created_by,
        arbitrator_user_id: record.arbitrator_user_id
    };
}