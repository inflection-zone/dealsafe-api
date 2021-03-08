'use strict';

const db = require('../database/connection');
const Transaction = require('../database/models/Transaction').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (requestBody) => {
    try {
        var entity = get_entity_to_save(requestBody)
        var record = await Transaction.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while creating transaction instance!';
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
        var records = await Transaction.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while retrieving transaction instances!';
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
        var record = await Transaction.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while retrieving transaction by id!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.update = async (id, requestBody) => {

    try {
        let updates = get_updates(requestBody);
        var res = await Transaction.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new Error('Unable to update transaction!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await Transaction.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while updating transaction!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.delete = async (id) => {
    try {
        var res = await Transaction.update({
            is_active: false
        }, {
            where: {
                id: id
            }
        });
        return res.length == 1;
    } catch (error) {
        var msg = 'Problem encountered while deleting transaction!';
        error_handler.throw_service_error(error, msg);
    }
}
module.exports.get_deleted = async () => {
    try {
        var records = await Transaction.findAll({
            where: {
                is_active: false
            }
        });
        for (var record of records) {
            objects.push(get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while deleted instances of transaction!';
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
        var record = await Transaction.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of transaction with id ' + id.toString() + '!';
        error_handler.throw_service_error(error, msg);
    }
}

function get_entity_to_save(requestBody) {
    return {
        display_id: requestBody.display_id ? requestBody.display_id : null,
        transaction_reference_id: requestBody.transaction_reference_id ? requestBody.transaction_reference_id : null,
        escrow_bank_reference_id: requestBody.escrow_bank_reference_id ? requestBody.escrow_bank_reference_id : null,
        contract_id: requestBody.contract_id ? requestBody.contract_id : null,
        milestone_id: requestBody.milestone_id ? requestBody.milestone_id : null,
        paid_by_id: requestBody.paid_by_id ? requestBody.paid_by_id : null,
        paid_to_id: requestBody.paid_to_id ? requestBody.paid_to_id : null,
        payee_account_type_id: requestBody.payee_account_type_id ? requestBody.payee_account_type_id : null,
        payer_account_type_id: requestBody.payer_account_type_id ? requestBody.payer_account_type_id : null,
        pay_from_account_number: requestBody.pay_from_account_number ? requestBody.pay_from_account_number : null,
        pay_to_account_number: requestBody.pay_to_account_number ? requestBody.pay_to_account_number : null,
        transaction_amount: requestBody.transaction_amount ? requestBody.transaction_amount : null,
        transaction_date: requestBody.transaction_date ? requestBody.transaction_date : null,
        transaction_initiated_by: requestBody.transaction_initiated_by ? requestBody.transaction_initiated_by : null,
        transaction_approved_by: requestBody.transaction_approved_by ? requestBody.transaction_approved_by : null,
        transaction_type: requestBody.transaction_type ? requestBody.transaction_type : null,
        currency: requestBody.currency ? requestBody.currency : 'INR',
        payment_request_id: requestBody.payment_request_id ? requestBody.payment_request_id : null,
        transaction_status: requestBody.transaction_status ? requestBody.transaction_status : 1,
        remarks: requestBody.remarks ? requestBody.remarks : null
    };
}

function get_updates(requestBody) {
    let updates = {};
    if (requestBody.hasOwnProperty('display_id')) {
        updates.display_id = requestBody.display_id;
    }
    if (requestBody.hasOwnProperty('transaction_reference_id')) {
        updates.transaction_reference_id = requestBody.transaction_reference_id;
    }
    if (requestBody.hasOwnProperty('escrow_bank_reference_id')) {
        updates.escrow_bank_reference_id = requestBody.escrow_bank_reference_id;
    }
    if (requestBody.hasOwnProperty('contract_id')) {
        updates.contract_id = requestBody.contract_id;
    }
    if (requestBody.hasOwnProperty('milestone_id')) {
        updates.milestone_id = requestBody.milestone_id;
    }
    if (requestBody.hasOwnProperty('paid_by_id')) {
        updates.paid_by_id = requestBody.paid_by_id;
    }
    if (requestBody.hasOwnProperty('paid_to_id')) {
        updates.paid_to_id = requestBody.paid_to_id;
    }
    if (requestBody.hasOwnProperty('payee_account_type_id')) {
        updates.payee_account_type_id = requestBody.payee_account_type_id;
    }
    if (requestBody.hasOwnProperty('payer_account_type_id')) {
        updates.payer_account_type_id = requestBody.payer_account_type_id;
    }
    if (requestBody.hasOwnProperty('pay_from_account_number')) {
        updates.pay_from_account_number = requestBody.pay_from_account_number;
    }
    if (requestBody.hasOwnProperty('pay_to_account_number')) {
        updates.pay_to_account_number = requestBody.pay_to_account_number;
    }
    if (requestBody.hasOwnProperty('transaction_amount')) {
        updates.transaction_amount = requestBody.transaction_amount;
    }
    if (requestBody.hasOwnProperty('transaction_date')) {
        updates.transaction_date = requestBody.transaction_date;
    }
    if (requestBody.hasOwnProperty('transaction_initiated_by')) {
        updates.transaction_initiated_by = requestBody.transaction_initiated_by;
    }
    if (requestBody.hasOwnProperty('transaction_approved_by')) {
        updates.transaction_approved_by = requestBody.transaction_approved_by;
    }
    if (requestBody.hasOwnProperty('transaction_type')) {
        updates.transaction_type = requestBody.transaction_type;
    }
    if (requestBody.hasOwnProperty('currency')) {
        updates.currency = requestBody.currency;
    }
    if (requestBody.hasOwnProperty('payment_request_id')) {
        updates.payment_request_id = requestBody.payment_request_id;
    }
    if (requestBody.hasOwnProperty('transaction_status')) {
        updates.transaction_status = requestBody.transaction_status;
    }
    if (requestBody.hasOwnProperty('remarks')) {
        updates.remarks = requestBody.remarks;
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
        transaction_reference_id: record.transaction_reference_id,
        escrow_bank_reference_id: record.escrow_bank_reference_id,
        contract_id: record.contract_id,
        milestone_id: record.milestone_id,
        paid_by_id: record.paid_by_id,
        paid_to_id: record.paid_to_id,
        payee_account_type_id: record.payee_account_type_id,
        payer_account_type_id: record.payer_account_type_id,
        pay_from_account_number: record.pay_from_account_number,
        pay_to_account_number: record.pay_to_account_number,
        transaction_amount: record.transaction_amount,
        transaction_date: record.transaction_date,
        transaction_initiated_by: record.transaction_initiated_by,
        transaction_approved_by: record.transaction_approved_by,
        transaction_type: record.transaction_type,
        currency: record.currency,
        payment_request_id: record.payment_request_id,
        transaction_status: record.transaction_status,
        remarks: record.remarks
    };
}