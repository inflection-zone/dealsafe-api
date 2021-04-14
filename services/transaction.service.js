'use strict';

const db = require('../database/connection');
const Transaction = require('../database/models/Transaction').Model;
const helper = require('../common/helper');
const { ApiError } = require('../common/api_error');
const logger = require('../common/logger');
const Op = require('sequelize').Op;

//////////////////////////////////////////////////////////////////////////////////////

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
        var record = await Transaction.create(entity);
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

        if (filter.hasOwnProperty('display_id')) {
            search.where.display_id = filter.display_id;
        }

        if (filter.hasOwnProperty('transaction_reference_id')) {
            search.where.transaction_reference_id = filter.transaction_reference_id;
        }

        if (filter.hasOwnProperty('escrow_bank_reference_id')) {
            filter.where.escrow_bank_reference_id = filter.escrow_bank_reference_id;
        }

        if (filter.hasOwnProperty('contract_id')) {
            filter.where.contract_id = filter.contract_id;
        }

        if (filter.hasOwnProperty('milestone_id')) {
            filter.where.milestone_id = filter.milestone_id;
        }

        if (filter.hasOwnProperty('paid_by_company_id')) {
            filter.where.paid_by_company_id = filter.paid_by_company_id;
        }

        if (filter.hasOwnProperty('paid_to_company_id')) {
            filter.where.paid_to_company_id = filter.paid_to_company_id;
        }

        if (filter.hasOwnProperty('transaction_initiated_by')) {
            filter.where.transaction_initiated_by = filter.transaction_initiated_by;
        }

        if (filter.hasOwnProperty('from_transaction_date') && 
            filter.hasOwnProperty('to_transaction_date')) {
            filter.where.transaction_date = {
                [Op.gte] : filter.from_transaction_date,
                [Op.lte] : filter.to_transaction_date
            };
        }

        if (filter.hasOwnProperty('transaction_status')) {
            filter.where.transaction_status = filter.transaction_status;
        }

        var records = await Transaction.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }

        sort_transactions(filter, objects);
        paginate_transactions(filter, objects);
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
        var record = await Transaction.findOne(search);
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
        var res = await Transaction.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new ApiError('Unable to update transaction!');
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
        throw (error);
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
        throw (error);
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
        var record = await Transaction.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        throw (error);
    }
}

//////////////////////////////////////////////////////////////////////////////////////

function get_entity_to_save(request_body) {
    return {
        display_id: helper.generate_display_id(),
        transaction_reference_id: request_body.transaction_reference_id ? request_body.transaction_reference_id : null,
        escrow_bank_reference_id: request_body.escrow_bank_reference_id ? request_body.escrow_bank_reference_id : null,
        contract_id: request_body.contract_id,
        milestone_id: request_body.milestone_id ? request_body.milestone_id : null,
        paid_by_company_id: request_body.paid_by_company_id ? request_body.paid_by_company_id : null,
        paid_to_company_id: request_body.paid_to_company_id ? request_body.paid_to_company_id : null,
        payee_account_type_id: request_body.payee_account_type_id ? request_body.payee_account_type_id : null,
        payer_account_type_id: request_body.payer_account_type_id ? request_body.payer_account_type_id : null,
        pay_from_account_number: request_body.pay_from_account_number ? request_body.pay_from_account_number : null,
        pay_to_account_number: request_body.pay_to_account_number ? request_body.pay_to_account_number : null,
        transaction_amount: request_body.transaction_amount,
        transaction_date: request_body.transaction_date ? request_body.transaction_date : null,
        transaction_initiated_by: request_body.transaction_initiated_by ? request_body.transaction_initiated_by : null,
        transaction_approved_by: request_body.transaction_approved_by ? request_body.transaction_approved_by : null,
        transaction_type: request_body.transaction_type ? request_body.transaction_type : null,
        currency: request_body.currency ? request_body.currency : 'INR',
        payment_request_id: request_body.payment_request_id ? request_body.payment_request_id : null,
        transaction_status: 1,
        remarks: request_body.remarks ? request_body.remarks : null
    };
}

function get_updates(request_body) {
    let updates = {};

    if (request_body.hasOwnProperty('transaction_reference_id')) {
        updates.transaction_reference_id = request_body.transaction_reference_id;
    }
    if (request_body.hasOwnProperty('escrow_bank_reference_id')) {
        updates.escrow_bank_reference_id = request_body.escrow_bank_reference_id;
    }
    if (request_body.hasOwnProperty('contract_id')) {
        updates.contract_id = request_body.contract_id;
    }
    if (request_body.hasOwnProperty('milestone_id')) {
        updates.milestone_id = request_body.milestone_id;
    }
    if (request_body.hasOwnProperty('paid_by_company_id')) {
        updates.paid_by_company_id = request_body.paid_by_company_id;
    }
    if (request_body.hasOwnProperty('paid_to_company_id')) {
        updates.paid_to_company_id = request_body.paid_to_company_id;
    }
    if (request_body.hasOwnProperty('payee_account_type_id')) {
        updates.payee_account_type_id = request_body.payee_account_type_id;
    }
    if (request_body.hasOwnProperty('payer_account_type_id')) {
        updates.payer_account_type_id = request_body.payer_account_type_id;
    }
    if (request_body.hasOwnProperty('pay_from_account_number')) {
        updates.pay_from_account_number = request_body.pay_from_account_number;
    }
    if (request_body.hasOwnProperty('pay_to_account_number')) {
        updates.pay_to_account_number = request_body.pay_to_account_number;
    }
    if (request_body.hasOwnProperty('transaction_amount')) {
        updates.transaction_amount = request_body.transaction_amount;
    }
    if (request_body.hasOwnProperty('transaction_date')) {
        updates.transaction_date = request_body.transaction_date;
    }
    if (request_body.hasOwnProperty('transaction_initiated_by')) {
        updates.transaction_initiated_by = request_body.transaction_initiated_by;
    }
    if (request_body.hasOwnProperty('transaction_approved_by')) {
        updates.transaction_approved_by = request_body.transaction_approved_by;
    }
    if (request_body.hasOwnProperty('transaction_type')) {
        updates.transaction_type = request_body.transaction_type;
    }
    if (request_body.hasOwnProperty('currency')) {
        updates.currency = request_body.currency;
    }
    if (request_body.hasOwnProperty('payment_request_id')) {
        updates.payment_request_id = request_body.payment_request_id;
    }
    if (request_body.hasOwnProperty('remarks')) {
        updates.remarks = request_body.remarks;
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
        paid_by_company_id: record.paid_by_company_id,
        paid_to_company_id: record.paid_to_company_id,
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

function sort_transactions(filter, array) {

    //default sorting by date - recent first
    array.sort((a, b) => { return new Date(b.transaction_date) - new Date(a.transaction_date) });
    
    if (!filter.hasOwnProperty('sort_by')) {
        return array;
    }

    if (filter.sort_by == "transaction_date") {
        if (filter.sort_type == "ascending") {
            array.sort((a, b) => { return new Date(a.created_at) - new Date(b.created_at) });
        }
        else {
            array.sort((a, b) => { return new Date(b.created_at) - new Date(alert.created_at) });
        }
    }

    if (filter.sort_by == "transaction_status") {
        array.sort((a, b) => {
            if (a.transaction_status < b.transaction_status) {
                return -1;
            }
            if (a.transaction_status > b.transaction_status) {
                return 1;
            }
            return 0;
        });
        if (filter.sort_type != "ascending") {
            array.reverse();
        }
    }
}

function paginate_transactions(filter, array) {
    if (filter.hasOwnProperty("page_number") && filter.hasOwnProperty("items_per_page")) {
        var start_offset = (filter.page_number - 1) * filter.items_per_page;
        var end_offset = filter.page_number * filter.items_per_page;
        var current_page = filter.page_number ? +filter.page_number : 1;
        var total_pages = Math.ceil(array.length / parseInt(filter.items_per_page));
        array = array.slice(start_offset, end_offset);
    }
    return {
        current_page: current_page,
        total_pages: total_pages,
        items_per_page: filter.items_per_page,
        transactions: array
    };
}

//////////////////////////////////////////////////////////////////////////////////////
