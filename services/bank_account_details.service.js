'use strict';

const db = require('../database/connection');
const BankAccountDetails = require('../database/models/BankAccountDetails').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
        var record = await BankAccountDetails.create(entity);
        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while creating bank_account_details instance!';
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
        var records = await BankAccountDetails.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while retrieving bank_account_details instances!';
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
        var record = await BankAccountDetails.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while retrieving bank_account_details by id!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.update = async (id, request_body) => {

    try {
        let updates = get_updates(request_body);
        var res = await BankAccountDetails.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new Error('Unable to update bank_account_details!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await BankAccountDetails.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while updating bank_account_details!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.delete = async (id) => {
    try {
        var res = await BankAccountDetails.update({
            is_active: false
        }, {
            where: {
                id: id
            }
        });
        return res.length == 1;
    } catch (error) {
        var msg = 'Problem encountered while deleting bank_account_details!';
        error_handler.throw_service_error(error, msg);
    }
}
module.exports.get_deleted = async () => {
    try {
        var records = await BankAccountDetails.findAll({
            where: {
                is_active: false
            }
        });
        for (var record of records) {
            objects.push(get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while deleted instances of bank_account_details!';
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
        var record = await BankAccountDetails.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of bank_account_details with id ' + id.toString() + '!';
        error_handler.throw_service_error(error, msg);
    }
}

function get_entity_to_save(request_body) {
    return {
        company_id: request_body.company_id ? request_body.company_id : null,
        user_id: request_body.user_id ? request_body.user_id : null,
        is_company_account: request_body.is_company_account ? request_body.is_company_account : null,
        account_number: request_body.account_number ? request_body.account_number : null,
        account_name: request_body.account_name ? request_body.account_name : null,
        account_type: request_body.account_type ? request_body.account_type : null,
        bank_name: request_body.bank_name ? request_body.bank_name : null,
        bank_branch: request_body.bank_branch ? request_body.bank_branch : null,
        bank_ifsc_code: request_body.bank_ifsc_code ? request_body.bank_ifsc_code : null,
        PAN: request_body.PAN ? request_body.PAN : null
    };
}

function get_updates(request_body) {
    let updates = {};
    if (request_body.hasOwnProperty('company_id')) {
        updates.company_id = request_body.company_id;
    }
    if (request_body.hasOwnProperty('user_id')) {
        updates.user_id = request_body.user_id;
    }
    if (request_body.hasOwnProperty('is_company_account')) {
        updates.is_company_account = request_body.is_company_account;
    }
    if (request_body.hasOwnProperty('account_number')) {
        updates.account_number = request_body.account_number;
    }
    if (request_body.hasOwnProperty('account_name')) {
        updates.account_name = request_body.account_name;
    }
    if (request_body.hasOwnProperty('account_type')) {
        updates.account_type = request_body.account_type;
    }
    if (request_body.hasOwnProperty('bank_name')) {
        updates.bank_name = request_body.bank_name;
    }
    if (request_body.hasOwnProperty('bank_branch')) {
        updates.bank_branch = request_body.bank_branch;
    }
    if (request_body.hasOwnProperty('bank_ifsc_code')) {
        updates.bank_ifsc_code = request_body.bank_ifsc_code;
    }
    if (request_body.hasOwnProperty('PAN')) {
        updates.PAN = request_body.PAN;
    }
    return updates;
}

function get_object_to_send(record) {
    if (record == null) {
        return null;
    }
    return {
        id: record.id,
        company_id: record.company_id,
        user_id: record.user_id,
        is_company_account: record.is_company_account,
        account_number: record.account_number,
        account_name: record.account_name,
        account_type: record.account_type,
        bank_name: record.bank_name,
        bank_branch: record.bank_branch,
        bank_ifsc_code: record.bank_ifsc_code,
        PAN: record.PAN
    };
}