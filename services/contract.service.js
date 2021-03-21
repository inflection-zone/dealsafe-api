'use strict';

const db = require('../database/connection');
const Contract = require('../database/models/Contract').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
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

module.exports.update = async (id, request_body) => {

    try {
        let updates = get_updates(request_body);
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

function get_entity_to_save(request_body) {
    return {
        display_id: request_body.display_id ? request_body.display_id : null,
        contract_type: request_body.contract_type ? request_body.contract_type : 1,
        name: request_body.name ? request_body.name : null,
        description: request_body.description ? request_body.description : null,
        is_full_payment_contract: request_body.is_full_payment_contract ? request_body.is_full_payment_contract : true,
        buyer_company_id: request_body.buyer_company_id ? request_body.buyer_company_id : null,
        buyer_contact_user_id: request_body.buyer_contact_user_id ? request_body.buyer_contact_user_id : null,
        seller_company_id: request_body.seller_company_id ? request_body.seller_company_id : null,
        seller_contact_user_id: request_body.seller_contact_user_id ? request_body.seller_contact_user_id : null,
        created_date: request_body.created_date ? request_body.created_date : null,
        buyer_agreed_date: request_body.buyer_agreed_date ? request_body.buyer_agreed_date : null,
        seller_agreed_date: request_body.seller_agreed_date ? request_body.seller_agreed_date : null,
        execution_planned_start_date: request_body.execution_planned_start_date ? request_body.execution_planned_start_date : null,
        execution_planned_end_date: request_body.execution_planned_end_date ? request_body.execution_planned_end_date : null,
        execution_actual_start_date: request_body.execution_actual_start_date ? request_body.execution_actual_start_date : null,
        execution_actual_end_date: request_body.execution_actual_end_date ? request_body.execution_actual_end_date : null,
        base_contract_amount: request_body.base_contract_amount ? request_body.base_contract_amount : null,
        tax_amount: request_body.tax_amount ? request_body.tax_amount : null,
        buyer_brokerage_amount: request_body.buyer_brokerage_amount ? request_body.buyer_brokerage_amount : null,
        seller_brokerage_amount: request_body.seller_brokerage_amount ? request_body.seller_brokerage_amount : null,
        has_buyer_deposited_amount: request_body.has_buyer_deposited_amount ? request_body.has_buyer_deposited_amount : false,
        has_seller_deposited_amount: request_body.has_seller_deposited_amount ? request_body.has_seller_deposited_amount : false,
        current_status: request_body.current_status ? request_body.current_status : 1,
        is_cancelled: request_body.is_cancelled ? request_body.is_cancelled : false,
        is_closed: request_body.is_closed ? request_body.is_closed : false,
        created_by: request_body.created_by ? request_body.created_by : null,
        arbitrator_user_id: request_body.arbitrator_user_id ? request_body.arbitrator_user_id : null
    };
}

function get_updates(request_body) {
    let updates = {};
    if (request_body.hasOwnProperty('display_id')) {
        updates.display_id = request_body.display_id;
    }
    if (request_body.hasOwnProperty('contract_type')) {
        updates.contract_type = request_body.contract_type;
    }
    if (request_body.hasOwnProperty('name')) {
        updates.name = request_body.name;
    }
    if (request_body.hasOwnProperty('description')) {
        updates.description = request_body.description;
    }
    if (request_body.hasOwnProperty('is_full_payment_contract')) {
        updates.is_full_payment_contract = request_body.is_full_payment_contract;
    }
    if (request_body.hasOwnProperty('buyer_company_id')) {
        updates.buyer_company_id = request_body.buyer_company_id;
    }
    if (request_body.hasOwnProperty('buyer_contact_user_id')) {
        updates.buyer_contact_user_id = request_body.buyer_contact_user_id;
    }
    if (request_body.hasOwnProperty('seller_company_id')) {
        updates.seller_company_id = request_body.seller_company_id;
    }
    if (request_body.hasOwnProperty('seller_contact_user_id')) {
        updates.seller_contact_user_id = request_body.seller_contact_user_id;
    }
    if (request_body.hasOwnProperty('created_date')) {
        updates.created_date = request_body.created_date;
    }
    if (request_body.hasOwnProperty('buyer_agreed_date')) {
        updates.buyer_agreed_date = request_body.buyer_agreed_date;
    }
    if (request_body.hasOwnProperty('seller_agreed_date')) {
        updates.seller_agreed_date = request_body.seller_agreed_date;
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
    if (request_body.hasOwnProperty('base_contract_amount')) {
        updates.base_contract_amount = request_body.base_contract_amount;
    }
    if (request_body.hasOwnProperty('tax_amount')) {
        updates.tax_amount = request_body.tax_amount;
    }
    if (request_body.hasOwnProperty('buyer_brokerage_amount')) {
        updates.buyer_brokerage_amount = request_body.buyer_brokerage_amount;
    }
    if (request_body.hasOwnProperty('seller_brokerage_amount')) {
        updates.seller_brokerage_amount = request_body.seller_brokerage_amount;
    }
    if (request_body.hasOwnProperty('has_buyer_deposited_amount')) {
        updates.has_buyer_deposited_amount = request_body.has_buyer_deposited_amount;
    }
    if (request_body.hasOwnProperty('has_seller_deposited_amount')) {
        updates.has_seller_deposited_amount = request_body.has_seller_deposited_amount;
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
    if (request_body.hasOwnProperty('created_by')) {
        updates.created_by = request_body.created_by;
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
        display_id: record.display_id,
        contract_type: record.contract_type,
        name: record.name,
        description: record.description,
        is_full_payment_contract: record.is_full_payment_contract,
        buyer_company_id: record.buyer_company_id,
        buyer_contact_user_id: record.buyer_contact_user_id,
        seller_company_id: record.seller_company_id,
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