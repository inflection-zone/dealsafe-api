'use strict';

const db = require('../database/connection');
const PaymentRequest = require('../database/models/PaymentRequest').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
        var record = await PaymentRequest.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while creating payment_request instance!';
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
        var records = await PaymentRequest.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while retrieving payment_request instances!';
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
        var record = await PaymentRequest.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while retrieving payment_request by id!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.update = async (id, request_body) => {

    try {
        let updates = get_updates(request_body);
        var res = await PaymentRequest.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new Error('Unable to update payment_request!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await PaymentRequest.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while updating payment_request!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.delete = async (id) => {
    try {
        var res = await PaymentRequest.update({
            is_active: false
        }, {
            where: {
                id: id
            }
        });
        return res.length == 1;
    } catch (error) {
        var msg = 'Problem encountered while deleting payment_request!';
        error_handler.throw_service_error(error, msg);
    }
}
module.exports.get_deleted = async () => {
    try {
        var records = await PaymentRequest.findAll({
            where: {
                is_active: false
            }
        });
        for (var record of records) {
            objects.push(get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while deleted instances of payment_request!';
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
        var record = await PaymentRequest.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of payment_request with id ' + id.toString() + '!';
        error_handler.throw_service_error(error, msg);
    }
}

function get_entity_to_save(request_body) {
    return {
        display_id: request_body.display_id ? request_body.display_id : null,
        contract_id: request_body.contract_id ? request_body.contract_id : null,
        milestone_id: request_body.milestone_id ? request_body.milestone_id : null,
        requested_by_user_id: request_body.requested_by_user_id ? request_body.requested_by_user_id : null,
        requested_to_user_id: request_body.requested_to_user_id ? request_body.requested_to_user_id : null,
        requested_to_company_id: request_body.requested_to_company_id ? request_body.requested_to_company_id : null,
        amount: request_body.amount ? request_body.amount : null,
        remarks: request_body.remarks ? request_body.remarks : null,
        request_date: request_body.request_date ? request_body.request_date : null,
        transaction_reference_id: request_body.transaction_reference_id ? request_body.transaction_reference_id : null,
        escrow_bank_reference_id: request_body.escrow_bank_reference_id ? request_body.escrow_bank_reference_id : null
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
    if (request_body.hasOwnProperty('milestone_id')) {
        updates.milestone_id = request_body.milestone_id;
    }
    if (request_body.hasOwnProperty('requested_by_user_id')) {
        updates.requested_by_user_id = request_body.requested_by_user_id;
    }
    if (request_body.hasOwnProperty('requested_to_user_id')) {
        updates.requested_to_user_id = request_body.requested_to_user_id;
    }
    if (request_body.hasOwnProperty('requested_to_company_id')) {
        updates.requested_to_company_id = request_body.requested_to_company_id;
    }
    if (request_body.hasOwnProperty('amount')) {
        updates.amount = request_body.amount;
    }
    if (request_body.hasOwnProperty('remarks')) {
        updates.remarks = request_body.remarks;
    }
    if (request_body.hasOwnProperty('request_date')) {
        updates.request_date = request_body.request_date;
    }
    if (request_body.hasOwnProperty('transaction_reference_id')) {
        updates.transaction_reference_id = request_body.transaction_reference_id;
    }
    if (request_body.hasOwnProperty('escrow_bank_reference_id')) {
        updates.escrow_bank_reference_id = request_body.escrow_bank_reference_id;
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
        milestone_id: record.milestone_id,
        requested_by_user_id: record.requested_by_user_id,
        requested_to_user_id: record.requested_to_user_id,
        requested_to_company_id: record.requested_to_company_id,
        amount: record.amount,
        remarks: record.remarks,
        request_date: record.request_date,
        transaction_reference_id: record.transaction_reference_id,
        escrow_bank_reference_id: record.escrow_bank_reference_id
    };
}