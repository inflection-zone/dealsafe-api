'use strict';

const db = require('../database/connection');
const Contract = require('../database/models/Contract').Model;
const ContractChecklist = require('../database/models/ContractChecklist').Model;
const Company = require('../database/models/Company').Model;
const ContractStatusTypes = require('../common/constants').ContractStatusTypes;
const ContractRoles = require('../common/constants').ContractRoles;
const helper = require('../common/helper');
const { ApiError } = require('../common/api_error');
const logger = require('../common/logger');
const Op = require('sequelize').Op;
const { QueryTypes} = require('sequelize');

//////////////////////////////////////////////////////////////////////////////////////

module.exports.create = async (request_body) => {
    try {
        var entity = get_entity_to_save(request_body)
        var record = await Contract.create(entity);
        //user this contract id to create checklist
        var contract_checklist = create_contract_checklist(record);
        var checklist_record = await ContractChecklist.create(contract_checklist);
        return await get_object_to_send(record);
    } catch (error) {
        throw (error);
    }
}

module.exports.search = async (filter) => {

    try {
        var array = [];
        var search = {
            where: {
                is_active: true
            }
        };

        var whereArray = [true];
        var condition = 'where is_active = ? ';
        
        // if(!(filter.hasOwnProperty('seller_contact_user_id') && filter.hasOwnProperty('buyer_contact_user_id'))){
        //     condition=condition+" and (seller_contact_user_id = ? or buyer_contact_user_id = ? ) ";
        //     whereArray.push(filter['current_user_id']);
        //     whereArray.push(filter['current_user_id']);
        // }

        if(filter.hasOwnProperty('seller_contact_user_id')){
            whereArray.push(filter.seller_contact_user_id);
            condition=condition+" and seller_contact_user_id = ?";
        }

        if(filter.hasOwnProperty('buyer_contact_user_id')){
            whereArray.push(filter.buyer_contact_user_id);
            condition=condition+" and buyer_contact_user_id = ?";
        }

        if (filter.hasOwnProperty('my_role')) {
            if (filter.my_role === 'buyer') {
                whereArray.push(ContractRoles.Buyer.type_id);
                whereArray.push(filter.current_user_id);
                condition=condition+" and creator_role = ? ";
                condition=condition+" and buyer_contact_user_id = ?";
            }

            if (filter.my_role === 'seller') {
                whereArray.push(ContractRoles.Seller.type_id);
                condition=condition+" and creator_role = ? ";
                whereArray.push(filter.current_user_id);
                condition=condition+" and seller_contact_user_id = ?";
            }
        }

        // if (filter.hasOwnProperty('my_role')) {
        //     if (filter.my_role === 'buyer') {
        //         whereArray.push(filter.current_user_company_id);
        //         condition=condition+" and buyer_company_id = ?";
        //     }

        //     if (filter.my_role === 'seller') {
        //         whereArray.push(filter.current_user_company_id);
        //         condition=condition+" and seller_company_id = ?";
        //     }
        // }
        // else {
        //     condition=condition+" and (buyer_company_id = ? or seller_company_id = ? ) ";
        //     whereArray.push(filter.current_user_company_id);
        //     whereArray.push(filter.current_user_company_id);

        // }

        if (filter.hasOwnProperty('name')) {
            whereArray.push("%"+filter.name+"%");
            condition=condition+" and name like ? ";
        }
        
        if (filter.hasOwnProperty('from_date') && filter.hasOwnProperty('to_date')) {
            whereArray.push(filter.from_date);
            whereArray.push(filter.to_date);
            condition=condition+" and created_at>= ? and created_at<= ? ";
        }
        if (filter.hasOwnProperty('state')) {
            if (filter.state === 'created') {
                whereArray.push(ContractStatusTypes.Created.code);
                condition=condition+" and current_status= ? ";
            }
            if (filter.state === 'in-progress') {
                whereArray.push(ContractStatusTypes.InProgress.code);
                condition=condition+" and current_status= ? ";
            }
            if (filter.state === 'closed') {
                whereArray.push(ContractStatusTypes.Closed.code);
                condition=condition+" and current_status= ? ";
            }
            if (filter.state === 'cancelled') {
                whereArray.push(ContractStatusTypes.Cancelled.code);
                condition=condition+" and current_status= ? ";
            }
        }

        //var records = await Contract.findAll(search);
        console.log('filter = ', filter);
        console.log('-----------------------');
        let query = "SELECT * FROM public.contracts "+condition;
        console.log('query=', query);
        console.log('whereArray=', whereArray);
        var records=await db.sequelize.query(
            query,
            {
              replacements: whereArray,
              type: QueryTypes.SELECT
            }
        );
        // console.log(await db.sequelize.query(
        //     query,
        //     {
        //       replacements: whereArray,
        //       type: QueryTypes.SELECT
        //     }
        // ));
        // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>', records);

        if (filter.hasOwnProperty('other_company_name')) {
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
            var obj = await get_object_to_send(record);
            array.push(obj);
        }

        sort_contracts(filter, array);
        return paginate_contracts(filter, array);

    }
    catch (error) {
        logger.log(error.message);
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
        var record = await Contract.findOne(search);
        if (record == null) {
            return null;
        }
        return await get_object_to_send(record);
    } catch (error) {
        throw (error);
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
        throw (error);
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
        throw (error);
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
        var record = await Contract.findOne(search);
        if (record == null) {
            return null;
        }
        return record != null;
    } catch (error) {
        throw (error);
    }
}

module.exports.buyer_agrees = async (id, user) => {
    try {
        let updates = {};
        updates.buyer_agreed_date = Date.now();
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
            throw new ApiError('Contract not found');
        }

        let updateContractChecklist = {};
        updateContractChecklist.buyer_agreed = true;
        //update contract checklist
        var result = await ContractChecklist.update(updateContractChecklist, {
            where: {
                contract_id: id
            }
        });
        if (result.length != 1) {
            throw new ApiError('Unable to update contract buyer_agreed!');
        }

        return await get_object_to_send(record);
    } catch (error) {
        throw (error);
    }
}

module.exports.seller_agrees = async (id, user) => {
    try {
        let updates = {};
        updates.seller_agreed_date = Date.now();
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

        let updateContractChecklist = {};
        updateContractChecklist.seller_agreed = true;
        //update contract checklist
        var result = await ContractChecklist.update(updateContractChecklist, {
            where: {
                contract_id: id
            }
        });
        if (result.length != 1) {
            throw new ApiError('Unable to update contract seller_agreed!');
        }

        return await get_object_to_send(record);
    } catch (error) {
        throw (error);
    }
}

module.exports.buyer_rejects = async (id, user) => {
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

        let updateContractChecklist = {};
        updateContractChecklist.buyer_agreed = false;
        //update contract checklist
        var result = await ContractChecklist.update(updateContractChecklist, {
            where: {
                contract_id: id
            }
        });
        if (result.length != 1) {
            throw new ApiError('Unable to update contract buyer_rejects!');
        }

        return await get_object_to_send(record);
    } catch (error) {
        throw (error);
    }
}

module.exports.seller_rejects = async (id, user) => {
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

        let updateContractChecklist = {};
        updateContractChecklist.seller_agreed = false;
        //update contract checklist
        var result = await ContractChecklist.update(updateContractChecklist, {
            where: {
                contract_id: id
            }
        });
        if (result.length != 1) {
            throw new ApiError('Unable to update contract seller_rejects!');
        }

        return await get_object_to_send(record);
    } catch (error) {
        throw (error);
    }
}

module.exports.freeze_contract_details = async (id, user) => {
    try {
        return null;
    } catch (error) {
        throw (error);
    }
}

module.exports.buyer_deposits_escrow = async (req_body) => {
    try {
        let updates = {};
        updates.transaction_id = req_body.transaction_id;
        updates.buyer_brokerage_amount = req_body.amount;
        var res = await Contract.update(updates, {
            where: {
                id: req_body.contract_id
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
            throw new ApiError('Contract not found');
        }

        let updateContractChecklist = {};
        updateContractChecklist.execution_started = true;
        //update contract checklist
        var result = await ContractChecklist.update(updateContractChecklist, {
            where: {
                contract_id: id
            }
        });
        if (result.length != 1) {
            throw new ApiError('Unable to update contract buyer_agreed!');
        }

        return await get_object_to_send(record);
    } catch (error) {
        throw (error);
    }
}

module.exports.start_execution = async (id, user) => {
    try {
        let updates = {};
        updates.execution_actual_start_date = Date.now();
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
            throw new ApiError('Contract not found');
        }

        let updateContractChecklist = {};
        updateContractChecklist.execution_started = true;
        //update contract checklist
        var result = await ContractChecklist.update(updateContractChecklist, {
            where: {
                contract_id: id
            }
        });
        if (result.length != 1) {
            throw new ApiError('Unable to update contract buyer_agreed!');
        }

        return await get_object_to_send(record);
    } catch (error) {
        throw (error);
    }
}

module.exports.close_contract = async (id, user) => {
    try {
        let updates = {};
        updates.execution_actual_end_date = Date.now();
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
            throw new ApiError('Contract not found');
        }

        let updateContractChecklist = {};
        updateContractChecklist.execution_ended = true;
        //update contract checklist
        var result = await ContractChecklist.update(updateContractChecklist, {
            where: {
                contract_id: id
            }
        });
        if (result.length != 1) {
            throw new ApiError('Unable to update contract buyer_agreed!');
        }

        return await get_object_to_send(record);
    } catch (error) {
        throw (error);
    }
}

//////////////////////////////////////////////////////////////////////////////////////

function create_contract_checklist(contract_details) {
    var check_list = {};
    if (contract_details == null) {
        return null;
    }

    check_list.contract_id = contract_details.id ? contract_details.id : null;
    check_list.buyer_agreed = contract_details.buyer_agreed_date ? true : false;
    check_list.seller_agreed = contract_details.seller_agreed_date ? true : false;
    check_list.buyer_paid_escrow_amount = contract_details.base_contract_amount ? true : false;
    check_list.buyer_paid_brokerage = contract_details.buyer_brokerage_amount ? true : false;
    check_list.seller_paid_brokerage = contract_details.seller_brokerage_amount ? true : false;
    check_list.execution_started = contract_details.execution_actual_start_date ? true : false;
    check_list.execution_ended = contract_details.execution_actual_end_date ? true : false;
    check_list.full_payment_released = contract_details.is_full_payment_contract ? true : false;
    check_list.Closed = contract_details.is_closed ? true : false;

    return check_list;
}

function get_entity_to_save(entity) {

    var role_type_id = ContractRoles.Buyer.type_id;
    if (entity.creator_role) {
        if (entity.creator_role.toLowerCase()=="seller") {
            role_type_id = ContractRoles.Seller.type_id;
        }
    }
    return {
        display_id: helper.generate_display_id(),

        name: entity.name ? entity.name : null,
        description: entity.description ? entity.description : null,

        is_full_payment_contract: entity.is_full_payment_contract,

        buyer_company_id: entity.buyer_company_id,
        buyer_contact_user_id: entity.buyer_contact_user_id ? entity.buyer_contact_user_id : null,
        seller_company_id: entity.seller_company_id,
        seller_contact_user_id: entity.seller_contact_user_id ? entity.seller_contact_user_id : null,

        created_date: Date.now(),
        creator_role: role_type_id,
        created_by_user_id: entity.created_by_user_id,

        execution_planned_start_date: entity.execution_planned_start_date ? entity.execution_planned_start_date : null,
        execution_planned_end_date: entity.execution_planned_end_date ? entity.execution_planned_end_date : null,

        base_contract_amount: entity.base_contract_amount ? entity.base_contract_amount : null,

        current_status: ContractStatusTypes.Created.type_id,
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
    var checklist = await ContractChecklist.findOne({ where: { contract_id: record.id } });
    var buyer_company = await Company.findByPk(record.buyer_company_id);
    var seller_company = await Company.findByPk(record.seller_company_id);

    return {
        id: record.id,
        display_id: record.display_id ? record.display_id : null,
        contract_type: record.contract_type ? record.contract_type : null,
        name: record.name ? record.name : null,
        description: record.description ? record.description : null,
        creator_role: record.creator_role ? record.creator_role : null,

        is_full_payment_contract: record.is_full_payment_contract ? record.is_full_payment_contract : null,

        buyer_company_id: record.buyer_company_id ? record.buyer_company_id : null,
        buyer_contact_user_id: record.buyer_contact_user_id ? record.buyer_contact_user_id : null,
        seller_company_id: record.seller_company_id ? record.seller_company_id : null,
        seller_contact_user_id: record.seller_contact_user_id ? record.seller_contact_user_id : null,

        created_date: record.created_date ? record.created_date : null,
        created_by_user_id: record.created_by_user_id ? record.created_by_user_id : null,
        buyer_agreed_date: record.buyer_agreed_date ? record.buyer_agreed_date : null,
        seller_agreed_date: record.seller_agreed_date ? record.seller_agreed_date : null,

        execution_planned_start_date: record.execution_planned_start_date ? record.execution_planned_start_date : null,
        execution_planned_end_date: record.execution_planned_end_date ? record.execution_planned_end_date : null,
        execution_actual_start_date: record.execution_actual_start_date ? record.execution_actual_start_date : null,
        execution_actual_end_date: record.execution_actual_end_date ? record.execution_actual_end_date : null,

        base_contract_amount: record.base_contract_amount ? record.base_contract_amount : null,
        tax_amount: record.tax_amount ? record.tax_amount : null,
        buyer_brokerage_amount: record.buyer_brokerage_amount ? record.buyer_brokerage_amount : null,
        seller_brokerage_amount: record.seller_brokerage_amount ? record.seller_brokerage_amount : null,
        has_buyer_deposited_amount: record.has_buyer_deposited_amount ? record.has_buyer_deposited_amount : null,
        has_seller_deposited_amount: record.has_seller_deposited_amount ? record.has_seller_deposited_amount : null,

        current_status: record.current_status ? record.current_status : null,

        is_cancelled: record.is_cancelled ? record.is_cancelled : null,
        is_closed: record.is_closed ? record.is_closed : null,

        created_by: record.created_by ? record.created_by : null,
        arbitrator_user_id: record.arbitrator_user_id ? record.arbitrator_user_id : null,

        contract_checklist: checklist ? checklist : null
    };
}

function sort_contracts(filter, array) {

    //default sorting by date - recent first
    array.sort((a, b) => { return new Date(b.created_date) - new Date(a.created_date) });
    if (!filter.hasOwnProperty('sort_by')) {
        return array;
    }

    if (filter.sort_by == "created_date") {
        if (filter.sort_type == "ascending") {
            array.sort((a, b) => { return new Date(a.created_at) - new Date(b.created_at) });
        }
        else {
            array.sort((a, b) => { return new Date(b.created_at) - new Date(b.created_at) });
        }
    }
    if (filter.sort_by == "name") {
        array.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
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
            if (a.seller_company_name < b.seller_company_name) {
                return -1;
            }
            if (a.seller_company_name > b.seller_company_name) {
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
            if (a.buyer_company_name < b.buyer_company_name) {
                return -1;
            }
            if (a.buyer_company_name > b.buyer_company_name) {
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

//////////////////////////////////////////////////////////////////////////////////////
