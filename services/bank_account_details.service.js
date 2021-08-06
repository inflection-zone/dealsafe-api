'use strict';

const db = require('../database/connection');
const BankAccountDetails = require('../database/models/BankAccountDetails').Model;
const helper = require('../common/helper');
const logger = require('../common/logger');
const { ApiError } = require('../common/api_error');
const Op = require('sequelize').Op;

module.exports.create = async (req) => {
    try {
        var request_body = req.body;
        request_body.company_id = req.company_id;
        request_body.user_id = req.user.user_id;
        var entity = await get_entity_to_save(request_body);
        var record = await BankAccountDetails.create(entity);
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
        if (filter.hasOwnProperty('company_id')) {
            search.where.company_id = filter.company_id;
        }
        var records = await BankAccountDetails.findAll(search);
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
        var record = await BankAccountDetails.findOne(search);
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
        var res = await BankAccountDetails.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new ApiError('Unable to update bank_account_details!');
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
        throw (error);
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
        throw (error);
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
        throw (error);
    }
}

module.exports.bank_exists_with = async (account_number, bank_ifsc_code, account_type, bank_name = null, bank_branch = null) => {
    try {
        var search = {
            where: {
                is_active: true,
            }
        };

        if (account_number) {
            search.where.account_number = { [Op.like]: '%' + account_number + '%' };
        }

        if (bank_ifsc_code) {
            search.where.bank_ifsc_code = { [Op.like]: '%' + bank_ifsc_code + '%' };
        }

        if (account_type) {
            search.where.account_type = account_type;
        }
        var records = await BankAccountDetails.findAll(search);
        return records.length > 0;

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
        var record = await BankAccountDetails.findOne(search);
        if (record == null) {
            return null;
        }
        return record != null;
    } catch (error) {
        throw (error);
    }
}

async function get_entity_to_save(request_body) {
    return {
        company_id: request_body.company_id ? request_body.company_id : null,
        user_id: request_body.user_id ? request_body.user_id : null,
        account_number: request_body.account_number ? request_body.account_number : null,
        account_name: request_body.account_name ? request_body.account_name : null,
        account_type: request_body.account_type ? request_body.account_type : 1,
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
        account_number: record.account_number,
        account_name: record.account_name,
        account_type: record.account_type,
        bank_name: record.bank_name,
        bank_branch: record.bank_branch,
        bank_ifsc_code: record.bank_ifsc_code,
        PAN: record.PAN
    };
}