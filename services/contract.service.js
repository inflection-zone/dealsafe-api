'use strict';

const db = require('../database/connection');
const Contract = require('../database/models/Contract').Model;
const ContractChecklist = require('../database/models/ContractChecklist').Model;
const Company = require('../database/models/Company').Model;
const ContractStatusTypes = require('../common/constants').ContractStatusTypes;
const Roles = require('../common/constants').Roles;
const helper = require('../common/helper');
const { ApiError } = require('../common/api_error');
const logger = require('../common/logger');
const Op = require('sequelize').Op;

//////////////////////////////////////////////////////////////////////////////////////

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
        var record = await Contract.create(entity);
        return await get_object_to_send(record);
    } catch (error) {
        throw(error);
    }
}

module.exports.search = async (filter) => {

    try {

        var search = {};
        if (filter.hasOwnProperty('my_role')) {
            if (filter.my_role === 'buyer') {
                search = {
                    where: {
                        is_active: true,
                        buyer_company_id: filter.current_user_company_id,
                    }
                };
            }
            else {
                search = {
                    where: {
                        is_active: true,
                        seller_company_id: filter.current_user_company_id,
                    }
                };
            }
        }
        else {
            search = {
                where: {
                    is_active: true,
                    [Op.or]: [
                        {
                            seller_company_id: filter.current_user_company_id,
                            buyer_company_id: filter.current_user_company_id,
                        }
                    ]
                }
            };
        }
        if (filter.hasOwnProperty('name')) {
            search.where.name = { [Op.iLike]: "%" + filter.name + "%" }
        }
        if (filter.hasOwnProperty('from_date') && filter.hasOwnProperty('to_date')) {
            search.where.created_date = {
                [Op.gte]: filter.from_date,
                [Op.lte]: filter.to_date
            }
        }
        if(filter.hasOwnProperty('state')){
            if(filter.state === 'created') {
                search.where.current_status = ContractStatusTypes.Created.code;
            }
            if(filter.state === 'in-progress') {
                search.where.current_status = ContractStatusTypes.InProgress.code;
            }
            if(filter.state === 'closed') {
                search.where.current_status = ContractStatusTypes.Closed.code;
            }
            if(filter.state === 'cancelled') {
                search.where.current_status = ContractStatusTypes.Cancelled.code;
            }
        }

        var records = await Contract.findAll(search);

        if(filter.hasOwnProperty('other_company_name')) {
            var companies = await Company.findAll({
                where: {
                    is_active: true,
                    name: { [Op.iLike]: "%" + filter.other_company_name + "%" },
                    id: { [Op.not]: filter.current_user_company_id }
                }
            });
            var company_ids = companies.map(x => x.id);
            var contracts = [];
            for await (var r of records) {
                if (company_ids.indexOf(r.seller_company_id) != -1 ||
                    company_ids.indexOf(r.buyer_company_id) != -1) {
                    contracts.push(r);
                }
            }
            records = contracts;
        }

        for await (var record of records) {
            var checklist = await ContractChecklist.findOne({
                where: {
                    contract_id: record.id
                }
            });
            var obj = await get_object_to_send(record, checklist);
            array.push(obj);
        }

        sort_contracts(filter, array);
        return paginate_contracts(filter, array);

    } 
    catch (error) {
        logger.log(error.message);
        throw(error);
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
        return await get_object_to_send(record);
    } catch (error) {
        throw(error);
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
            throw new ApiError('Unable to update contract!');
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

        return await get_object_to_send(record);
    } catch (error) {
        throw(error);
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
        throw(error);
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
            objects.push(await get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        throw(error);
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
        throw(error);
    }
}

//////////////////////////////////////////////////////////////////////////////////////

function get_entity_to_save(entity) {
    return {
        display_id: helper.generate_display_id(),

        name: entity.name ? entity.name : null,
        description: entity.description ? entity.description : null,

        is_full_payment_contract: entity.is_full_payment_contract,

        buyer_company_id: entity.buyer_company_id,
        buyer_contact_user_id: entity.buyer_contact_user_id ? entity.buyer_contact_user_id : null,
        seller_company_id: entity.seller_company_id,
        seller_contact_user_id: entity.seller_contact_user_id ? entity.seller_contact_user_id : null,

        created_date: entity.created_date,
        creator_role: entity.creator_role,
        created_by_user_id: entity.created_by_user_id,

        execution_planned_start_date: entity.execution_planned_start_date ? entity.execution_planned_start_date : null,
        execution_planned_end_date: entity.execution_planned_end_date ? entity.execution_planned_end_date : null,

        base_contract_amount: entity.base_contract_amount ? entity.base_contract_amount : null,

        current_status: ContractStatusTypes.Created.code,
    };
}

function get_updates(request_body) {
    let updates = {};
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
    if (request_body.hasOwnProperty('arbitrator_user_id')) {
        updates.arbitrator_user_id = request_body.arbitrator_user_id;
    }
    return updates;
}

async function get_object_to_send(record) {

    if (record == null) {
        return null;
    }
    var checklist = await ContractChecklist.create({ contract_id: record.id });
    var buyer_company = await Company.findByPk(record.buyer_company_id);
    var seller_company = await Company.findByPk(record.seller_company_id);
    
    return {
        id: record.id,
        display_id: record.display_id,
        contract_type: record.contract_type,
        name: record.name,
        description: record.description,
        creator_role: record.creator_role,

        is_full_payment_contract: record.is_full_payment_contract,

        buyer_company_id: record.buyer_company_id,
        buyer_contact_user_id: record.buyer_contact_user_id,
        buyer_company_name: buyer_company.name,
        seller_company_id: record.seller_company_id,
        seller_contact_user_id: record.seller_contact_user_id,
        seller_company_name: seller_company.name,

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
        arbitrator_user_id: record.arbitrator_user_id,

        contract_checklist: checklist
    };
}

function sort_contracts(filter, array) {

    //default sorting by date - recent first
    array.sort((a, b) => { return new Date(b.created_date) - new Date(a.created_date) });
    if (!filter.hasOwnProperty('sort_by')){
        return array;
    }

    if (filter.sort_by == "created_date") {
        if (filter.sort_type == "ascending") {
            array.sort((a, b) => { return new Date(a.created_at) - new Date(b.created_at) });
        }
        else {
            array.sort((a, b) => { return new Date(b.created_at) - new Date(alert.created_at) });
        }
    }
    if (filter.sort_by == "name") {
        array.sort((a, b) => { 
            if ( a.name < b.name ){
                return -1;
              }
              if ( a.name > b.name ){
                return 1;
              }
              return 0;
        });
        if (filter.sort_type != "ascending") {
            array.reverse();
        }
    }
    if (filter.sort_by == "seller_company_name") {
        array.sort((a, b) => { 
            if ( a.seller_company_name < b.seller_company_name ){
                return -1;
              }
              if ( a.seller_company_name > b.seller_company_name ){
                return 1;
              }
              return 0;
        });
        if (filter.sort_type != "ascending") {
            array.reverse();
        }
    }
    if (filter.sort_by == "buyer_company_name") {
        array.sort((a, b) => { 
            if ( a.buyer_company_name < b.buyer_company_name ){
                return -1;
              }
              if ( a.buyer_company_name > b.buyer_company_name ){
                return 1;
              }
              return 0;
        });
        if (filter.sort_type != "ascending") {
            array.reverse();
        }
    }
}

function paginate_contracts(filter, array) {
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
        contracts: array 
    };
}
