'use strict';

const db = require('../database/connection');
const BankAccountDetails = require('../database/models/BankAccountDetails').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const logger = require('../common/logger');

module.exports.create = async (requestBody) => {
    try {
        var entity = get_entity_to_save(requestBody)
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

module.exports.update = async (id, requestBody) => {

    try {
        let updates = get_updates(requestBody);
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

function get_entity_to_save(requestBody) {
    return {
        company_id: requestBody.company_id ? requestBody.company_id : null,
        user_id: requestBody.user_id ? requestBody.user_id : null,
        is_company_account: requestBody.is_company_account ? requestBody.is_company_account : null,
        account_number: requestBody.account_number ? requestBody.account_number : null,
        account_name: requestBody.account_name ? requestBody.account_name : null,
        account_type: requestBody.account_type ? requestBody.account_type : null,
        bank_name: requestBody.bank_name ? requestBody.bank_name : null,
        bank_branch: requestBody.bank_branch ? requestBody.bank_branch : null,
        bank_ifsc_code: requestBody.bank_ifsc_code ? requestBody.bank_ifsc_code : null,
        PAN: requestBody.pan ? requestBody.pan : null
    };
}

function get_updates(requestBody) {
    let updates = {};
    if (requestBody.hasOwnProperty('company_id')) {
        updates.company_id = requestBody.company_id;
    }
    if (requestBody.hasOwnProperty('user_id')) {
        updates.user_id = requestBody.user_id;
    }
    if (requestBody.hasOwnProperty('is_company_account')) {
        updates.is_company_account = requestBody.is_company_account;
    }
    if (requestBody.hasOwnProperty('account_number')) {
        updates.account_number = requestBody.account_number;
    }
    if (requestBody.hasOwnProperty('account_name')) {
        updates.account_name = requestBody.account_name;
    }
    if (requestBody.hasOwnProperty('account_type')) {
        updates.account_type = requestBody.account_type;
    }
    if (requestBody.hasOwnProperty('bank_name')) {
        updates.bank_name = requestBody.bank_name;
    }
    if (requestBody.hasOwnProperty('bank_branch')) {
        updates.bank_branch = requestBody.bank_branch;
    }
    if (requestBody.hasOwnProperty('bank_ifsc_code')) {
        updates.bank_ifsc_code = requestBody.bank_ifsc_code;
    }
    if (requestBody.hasOwnProperty('PAN')) {
        updates.PAN = requestBody.PAN;
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