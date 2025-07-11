'use strict';

const db = require('../database/connection');
const Contract = require('../database/models/Contract').Model;
const ContractChecklist = require('../database/models/ContractChecklist').Model;
const User = require('../database/models/User').Model;
const Company = require('../database/models/Company').Model;
const ContractStatusTypes = require('../common/constants').ContractStatusTypes;
const AmountPercentage = require('../common/constants').AmountPercentage;
const ContractRoles = require('../common/constants').ContractRoles;
const company_service = require('../services/company.service');
const contract_milestone_service = require('../services/contract_milestone.service');
const helper = require('../common/helper');
const { ApiError } = require('../common/api_error');
const logger = require('../common/logger');
const Op = require('sequelize').Op;
const { QueryTypes, where } = require('sequelize');

//////////////////////////////////////////////////////////////////////////////////////

module.exports.create = async (request_body) => {
    try {
        console.log("request_body=", request_body)
        var entity = get_entity_to_save(request_body)
        console.log("entity=", entity)
        var record = await Contract.create(entity);
        //user this contract id to create checklist
        var contract_checklist = create_contract_checklist(record);
        var checklist_record = await ContractChecklist.create(contract_checklist);
        return await get_object_to_send(record);
    } catch (error) {
        throw (error);
    }
}

module.exports.pending_tasks = async (filter) => {
    try {
        var whereArray = [];
        var whereArrayMilestone = [];
        var condition = 'where is_active=true ';
        var condition_milestone = 'where is_active=true ';
        var result = [];
        var contract_ids_array = [];
        var contract_ids = "";
        var contract_details = [];
        var todays_date = new Date();

        const tomorrow = new Date(todays_date)
        tomorrow.setDate(tomorrow.getDate() + 1)
        var dd = String(todays_date.getDate()).padStart(2, "0");
        var mm = String(todays_date.getMonth() + 1).padStart(2, "0"); //January is 0!
        var yyyy = todays_date.getFullYear();

        var dd1 = String(tomorrow.getDate()).padStart(2, "0");
        var mm1 = String(tomorrow.getMonth() + 1).padStart(2, "0"); //January is 0!
        var yyyy1 = tomorrow.getFullYear();

        todays_date = yyyy + "-" + mm + "-" + dd;
        //todays_date="2021-07-30"
        var tomorrow_date = yyyy1 + "-" + mm1 + "-" + dd1;
        //tomorrow_date="2021-07-31"

        if (filter.hasOwnProperty('my_role')) {

            if (filter.my_role === 'buyer') {
                whereArray.push(filter.current_user_id);
                condition = condition + "and buyer_contact_user_id = ?";
            } else if (filter.my_role === 'seller') {
                whereArray.push(filter.current_user_id);
                condition = condition + "and seller_contact_user_id = ?";
            } else {
                whereArray.push(filter.current_user_id);
                whereArray.push(filter.current_user_id);
                condition = condition + " and (seller_contact_user_id = ? or buyer_contact_user_id = ?) ";
            }

        } else {
            whereArray.push(filter.current_user_id);
            whereArray.push(filter.current_user_id);
            condition = condition + " and (seller_contact_user_id = ? or buyer_contact_user_id = ?)";
        }

        let query = "SELECT id, display_id, name, description, is_full_payment_contract, buyer_company_id, buyer_contact_user_id, seller_company_id, seller_contact_user_id, created_date, creator_role, created_by_user_id, buyer_agreed_date, seller_agreed_date, DATE(execution_planned_start_date) as execution_planned_start_date, DATE(execution_planned_end_date) as execution_planned_end_date, execution_actual_start_date, execution_actual_end_date, base_contract_amount, tax_amount, buyer_brokerage_amount, seller_brokerage_amount, has_buyer_deposited_amount, has_seller_deposited_amount, current_status, is_cancelled, is_closed, arbitrator_user_id, is_active, deleted_at, created_at, updated_at FROM contracts " + condition;
        // console.log("query", query);
        // console.log("wherearray", whereArray);
        var records = await db.sequelize.query(
            query,
            {
                replacements: whereArray,
                type: QueryTypes.SELECT
            }
        );

        var contracts_with_near_due_date = records.filter(record => (record.execution_planned_end_date >= todays_date && record.execution_planned_end_date <= tomorrow_date));
        console.log("contracts_with_near_due_date=", contracts_with_near_due_date);
        for await (var r of records) {
            contract_ids_array.push(r.id);
            contract_details[r.id] = r;
        }

        if (contract_ids_array.length > 0) {
            contract_ids = contract_ids_array.join("','");
            condition_milestone = condition_milestone + "and contract_id in ('" + contract_ids + "')";
        }

        if (filter.hasOwnProperty('execution_planned_start_date')) {
            condition_milestone = condition_milestone + "and execution_planned_start_date = ? ";
            whereArrayMilestone.push(filter.execution_planned_start_date);
        }

        if (filter.hasOwnProperty('execution_planned_end_date')) {
            condition_milestone = condition_milestone + "and execution_planned_end_date >= ? ";
            whereArrayMilestone.push(filter.execution_planned_end_date);
        }

        // if (filter.hasOwnProperty('current_status')) {
        //     condition_milestone = condition_milestone + "and current_status = ? ";
        //     whereArrayMilestone.push(Number(filter.current_status));
        // }

        if (filter.hasOwnProperty('current_status')) {
            if (filter.current_status === 'created') {
                whereArrayMilestone.push(ContractStatusTypes.Created.type_id);
                condition_milestone = condition_milestone + "and current_status = ? ";
            }
            if (filter.current_status === 'in-progress') {
                whereArrayMilestone.push(ContractStatusTypes.InProgress.type_id);
                condition_milestone = condition_milestone + "and current_status = ? ";
            }
            if (filter.current_status === 'closed') {
                whereArrayMilestone.push(ContractStatusTypes.Closed.type_id);
                condition_milestone = condition_milestone + "and current_status = ? ";
            }
            if (filter.current_status === 'cancelled') {
                whereArrayMilestone.push(ContractStatusTypes.Cancelled.type_id);
                condition_milestone = condition_milestone + "and current_status = ? ";
            }
        }

        if (filter.hasOwnProperty('is_cancelled')) {
            condition_milestone = condition_milestone + "and is_cancelled = ? ";
            whereArrayMilestone.push(filter.is_cancelled);
        }

        if (filter.hasOwnProperty('is_closed')) {
            condition_milestone = condition_milestone + "and is_closed = ? ";
            whereArrayMilestone.push(filter.is_closed);
        }

        query = "SELECT id  , display_id  , contract_id  , milestone_index  , name  , description  , created_date  , DATE(execution_planned_start_date) as execution_planned_start_date  , DATE(execution_planned_end_date) as execution_planned_end_date  , execution_actual_start_date  , execution_actual_end_date  , milestone_amount  , current_status  , is_cancelled  , is_closed  , transaction_id  , is_active  , deleted_at  , created_at  , updated_at FROM contract_milestones " + condition_milestone;

        var milestone_records = await db.sequelize.query(
            query,
            {
                replacements: whereArrayMilestone,
                type: QueryTypes.SELECT
            }
        );
        // console.log("contract_ids_array :", contract_ids_array);
        // console.log("milestone_records :", milestone_records);
        var milestones_with_near_due_date = milestone_records.filter(record => (record.execution_planned_end_date >= todays_date && record.execution_planned_end_date <= tomorrow_date));
        var milestone_contract_ids_with_near_due_date = milestones_with_near_due_date.map(record => record.contract_id);
        // console.log("milestones_with_near_due_date=", milestones_with_near_due_date);
        // console.log("milestone_contract_ids_with_near_due_date=", milestone_contract_ids_with_near_due_date);
        let pending_contract_milestones = {};
        pending_contract_milestones['pending_contracts'] = contracts_with_near_due_date;
        pending_contract_milestones['pending_milestones'] = milestones_with_near_due_date;
        return pending_contract_milestones;
    }
    catch (error) {
        //logger.log(error.message);
        throw (error);
    }
}

module.exports.pending_tasks_next = async (filter) => {
    try {
        var array = [];
        var search = {};
        var whereArray = [];
        var whereArrayMilestone = [];
        var condition = 'where is_active=true ';
        var condition_milestone = 'where is_active=true ';
        var result = [];
        var contract_ids_array = [];
        var contract_ids = "";
        var contract_details = [];
        if (filter.hasOwnProperty('my_role')) {

            if (filter.my_role === 'buyer') {
                whereArray.push(filter.current_user_id);
                condition = condition + "and buyer_contact_user_id = ?";
            } else if (filter.my_role === 'seller') {
                whereArray.push(filter.current_user_id);
                condition = condition + "and seller_contact_user_id = ?";
            } else {
                whereArray.push(filter.current_user_id);
                whereArray.push(filter.current_user_id);
                condition = condition + " and (seller_contact_user_id = ? or buyer_contact_user_id = ?) ";
            }

        } else {
            whereArray.push(filter.current_user_id);
            whereArray.push(filter.current_user_id);
            condition = condition + " and (seller_contact_user_id = ? or buyer_contact_user_id = ?)";
        }

        let query = "SELECT * FROM contracts " + condition;
        console.log("query", query);
        console.log("wherearray", whereArray);
        var records = await db.sequelize.query(
            query,
            {
                replacements: whereArray,
                type: QueryTypes.SELECT
            }
        );

        for await (var r of records) {
            contract_ids_array.push(r.id);
            contract_details[r.id] = r;
        }

        if (contract_ids_array.length > 0) {
            contract_ids = contract_ids_array.join("','");
            condition_milestone = condition_milestone + "and contract_id in ('" + contract_ids + "')";
        }

        if (filter.hasOwnProperty('execution_planned_start_date')) {
            condition_milestone = condition_milestone + "and execution_planned_start_date = ? ";
            whereArrayMilestone.push(filter.execution_planned_start_date);
        }

        if (filter.hasOwnProperty('execution_planned_end_date')) {
            condition_milestone = condition_milestone + "and execution_planned_end_date >= ? ";
            whereArrayMilestone.push(filter.execution_planned_end_date);
        }

        if (filter.hasOwnProperty('current_status')) {
            condition_milestone = condition_milestone + "and current_status = ? ";
            whereArrayMilestone.push(Number(filter.current_status));
        }

        if (filter.hasOwnProperty('is_cancelled')) {
            condition_milestone = condition_milestone + "and is_cancelled = ? ";
            whereArrayMilestone.push(filter.is_cancelled);
        }

        if (filter.hasOwnProperty('is_closed')) {
            condition_milestone = condition_milestone + "and is_closed = ? ";
            whereArrayMilestone.push(filter.is_closed);
        }

        query = "SELECT * FROM contract_milestones " + condition_milestone;

        var milestone_records = await db.sequelize.query(
            query,
            {
                replacements: whereArrayMilestone,
                type: QueryTypes.SELECT
            }
        );
        console.log("contract_ids_array :", contract_ids_array);
        console.log("milestone_records :", milestone_records);

        for (var m = 0; m < contract_ids_array.length; m++) {
            var cmdetails = { 'contract_id': contract_ids_array[m], 'contract_display_id': contract_details[contract_ids_array[m]].display_id, 'execution_planned_end_date': contract_details[contract_ids_array[m]].execution_planned_end_date, 'milestone_details': [] };
            for (var row of milestone_records) {
                row.contract_display_id = contract_details[row.contract_id].display_id;
                cmdetails.milestone_details.push(row);
            }
            result.push(cmdetails);
        }
        return result;
    }
    catch (error) {
        //logger.log(error.message);
        throw (error);
    }
}

module.exports.summary = async (filter) => {
    try {
        var array = [];
        var search = {};
        var whereArray = [];
        var condition = 'where is_active=true ';
        var result = {};

        if (filter.hasOwnProperty('my_role')) {

            if (filter.my_role === 'buyer') {
                //whereArray.push(ContractRoles.Buyer.type_id);
                //condition = condition + "and creator_role = ? ";
                whereArray.push(filter.current_user_id);
                condition = condition + "and buyer_contact_user_id = ?";
            }

            if (filter.my_role === 'seller') {
                // whereArray.push(ContractRoles.Seller.type_id);
                // condition = condition + "and creator_role = ? ";
                whereArray.push(filter.current_user_id);
                condition = condition + "and seller_contact_user_id = ?";
            }

            if (!(filter.my_role === 'seller' || filter.my_role === 'buyer')) {
                // whereArray.push(ContractRoles.Seller.type_id);
                // condition = condition + " creator_role = ? ";
                whereArray.push(filter.current_user_id);
                whereArray.push(filter.current_user_id);
                condition = condition + " and (seller_contact_user_id = ? or buyer_contact_user_id = ?) ";
            }

        } else {
            //whereArray.push(" in (1,2)"); // buyer and seller roles
            // condition = condition + " creator_role in (1,2) ";
            whereArray.push(filter.current_user_id);
            whereArray.push(filter.current_user_id);
            condition = condition + " and (seller_contact_user_id = ? or buyer_contact_user_id = ?)";

        }
        if (filter.hasOwnProperty('state')) {
            if (filter.state === 'pending') {
                whereArray.push(ContractStatusTypes.Created.type_id);
                condition = condition + " and current_status= ? ";
            }
            if (filter.state === 'in-progress') {
                whereArray.push(ContractStatusTypes.InProgress.type_id);
                condition = condition + " and current_status= ? ";
            }
            if (filter.state === 'closed') {
                whereArray.push(ContractStatusTypes.Closed.type_id);
                condition = condition + " and current_status= ? ";
            }
            if (filter.state === 'cancelled') {
                whereArray.push(ContractStatusTypes.Cancelled.type_id);
                condition = condition + " and current_status= ? ";
            }
        }

        let query = "SELECT creator_role, current_status, count(*) FROM contracts " + condition + " group by 1, 2";

        var records = await db.sequelize.query(
            query,
            {
                replacements: whereArray,
                type: QueryTypes.SELECT
            }
        );

        //console.log("records = ", records);
        result.buyer_summary = {
            'Pending': 0,
            'InProgress': 0,
            'Closed': 0,
            'Cancelled': 0,
            'Total': 0
        };
        result.seller_summary = {
            'Pending': 0,
            'InProgress': 0,
            'Closed': 0,
            'Cancelled': 0,
            'Total': 0
        };

        result.buyer_seller_summary = {
            'Pending': 0,
            'InProgress': 0,
            'Closed': 0,
            'Cancelled': 0,
            'Total': 0
        };
        //result.seller_summary = {};

        for await (var r of records) {
            if (r.creator_role == 1) {
                if (r.current_status == ContractStatusTypes.Created.type_id) {
                    result.buyer_summary.Pending = Number(r.count);
                    result.buyer_summary.Total = Number(result.buyer_summary.Total) + result.buyer_summary.Pending;
                    result.buyer_seller_summary.Pending = Number(result.buyer_seller_summary.Pending) + Number(r.count);
                }
                if (r.current_status == ContractStatusTypes.InProgress.type_id) {
                    result.buyer_summary.InProgress = Number(r.count);
                    result.buyer_summary.Total = Number(result.buyer_summary.Total) + result.buyer_summary.InProgress;
                    result.buyer_seller_summary.InProgress = Number(result.buyer_seller_summary.InProgress) + Number(r.count);
                }
                if (r.current_status == ContractStatusTypes.Closed.type_id) {
                    result.buyer_summary.Closed = Number(r.count);
                    result.buyer_summary.Total = Number(result.buyer_summary.Total) + result.buyer_summary.Closed;
                    result.buyer_seller_summary.Closed = Number(result.buyer_seller_summary.Closed) + Number(r.count);
                }
                if (r.current_status == ContractStatusTypes.Cancelled.type_id) {
                    result.buyer_summary.Cancelled = Number(r.count);
                    result.buyer_summary.Total = Number(result.buyer_summary.Total) + result.buyer_summary.Cancelled;
                    result.buyer_seller_summary.Cancelled = Number(result.buyer_seller_summary.Cancelled) + Number(r.count);
                }
            }

            if (r.creator_role == 2) {
                if (r.current_status == ContractStatusTypes.Created.type_id) {
                    result.seller_summary.Pending = Number(r.count);
                    result.seller_summary.Total = Number(result.seller_summary.Total) + result.seller_summary.Pending;
                    result.buyer_seller_summary.Pending = Number(result.buyer_seller_summary.Pending) + Number(r.count);
                }
                if (r.current_status == ContractStatusTypes.InProgress.type_id) {
                    result.seller_summary.InProgress = Number(r.count);
                    result.seller_summary.Total = Number(result.seller_summary.Total) + result.seller_summary.InProgress;
                    result.buyer_seller_summary.InProgress = Number(result.buyer_seller_summary.InProgress) + Number(r.count);
                }
                if (r.current_status == ContractStatusTypes.Closed.type_id) {
                    result.seller_summary.Closed = Number(r.count);
                    result.seller_summary.Total = Number(result.seller_summary.Total) + result.seller_summary.Closed;
                    result.buyer_seller_summary.Closed = Number(result.buyer_seller_summary.Closed) + Number(r.count);
                }
                if (r.current_status == ContractStatusTypes.Cancelled.type_id) {
                    result.seller_summary.Cancelled = Number(r.count);
                    result.seller_summary.Total = Number(result.seller_summary.Total) + result.seller_summary.Cancelled;
                    result.buyer_seller_summary.Cancelled = Number(result.buyer_seller_summary.Cancelled) + Number(r.count);
                }
            }

            result.buyer_seller_summary.Total = result.buyer_seller_summary.Pending + result.buyer_seller_summary.InProgress + result.buyer_seller_summary.Closed + result.buyer_seller_summary.Cancelled;

        }
        //console.log("result=", result);
        return result;
    }
    catch (error) {
        //logger.log(error.message);
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

        if (filter.hasOwnProperty('seller_contact_user_id')) {
            whereArray.push(filter.seller_contact_user_id);
            condition = condition + " and seller_contact_user_id = ?";
        }

        if (filter.hasOwnProperty('buyer_contact_user_id')) {
            whereArray.push(filter.buyer_contact_user_id);
            condition = condition + " and buyer_contact_user_id = ?";
        }

        if (filter.hasOwnProperty('my_role')) {
            if (filter.my_role === 'buyer') {
                //whereArray.push(ContractRoles.Buyer.type_id);
                whereArray.push(filter.current_user_id);
                //condition = condition + " and creator_role = ? ";
                condition = condition + " and buyer_contact_user_id = ?";
            }

            if (filter.my_role === 'seller') {
                //whereArray.push(ContractRoles.Seller.type_id);
                //condition = condition + " and creator_role = ? ";
                whereArray.push(filter.current_user_id);
                condition = condition + " and seller_contact_user_id = ?";
            }
        }

        if (filter.hasOwnProperty('name')) {
            whereArray.push("%" + filter.name + "%");
            condition = condition + " and name like ? ";
        }

        if (filter.hasOwnProperty('from_date') && filter.hasOwnProperty('to_date')) {
            whereArray.push(filter.from_date);
            whereArray.push(filter.to_date);
            condition = condition + " and created_at>= ? and created_at<= ? ";
        }

        if (filter.hasOwnProperty('state')) {
            if (filter.state === 'created') {
                whereArray.push(ContractStatusTypes.Created.type_id);
                condition = condition + " and current_status= ? ";
            }
            if (filter.state === 'in-progress') {
                whereArray.push(ContractStatusTypes.InProgress.type_id);
                condition = condition + " and current_status= ? ";
            }
            if (filter.state === 'closed') {
                whereArray.push(ContractStatusTypes.Closed.type_id);
                condition = condition + " and current_status= ? ";
            }
            if (filter.state === 'cancelled') {
                whereArray.push(ContractStatusTypes.Cancelled.type_id);
                condition = condition + " and current_status= ? ";
            }
        }
        let query = "SELECT * FROM contracts " + condition;
        // console.log("getcontractquery",query);
        // console.log("wherearray",whereArray);
        var records = await db.sequelize.query(
            query,
            {
                replacements: whereArray,
                type: QueryTypes.SELECT
            }
        );

        if (filter.hasOwnProperty('other_company_name')) {
            var companies = await Company.findAll({
                where: {
                    is_active: true,
                    name: { [Op.like]: "%" + filter.other_company_name + "%" },
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

module.exports.update = async (id, req) => {

    try {
        let updates = get_updates(req.body);

        if (req.body.hasOwnProperty('buyer_company_id')) {
            var buyer_company = await company_service.get_by_id(req.body.buyer_company_id);
            if (!buyer_company) {
                throw new ApiError('Buyer company record not found!', null, 404);
            }
        }
        if (req.body.hasOwnProperty('seller_company_id')) {
            var seller_company = await company_service.get_by_id(req.body.seller_company_id);
            if (!seller_company) {
                throw new ApiError('Seller company record not found!', null, 404);
            }
        }
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
    // check_list.buyer_agreed = contract_details.buyer_agreed_date ? true : false;
    // check_list.seller_agreed = contract_details.seller_agreed_date ? true : false;
    // check_list.buyer_paid_escrow_amount = contract_details.base_contract_amount ? true : false;
    // check_list.buyer_paid_brokerage = contract_details.buyer_brokerage_amount ? true : false;
    // check_list.seller_paid_brokerage = contract_details.seller_brokerage_amount ? true : false;
    // check_list.execution_started = contract_details.execution_actual_start_date ? true : false;
    // check_list.execution_ended = contract_details.execution_actual_end_date ? true : false;
    // check_list.full_payment_released = contract_details.is_full_payment_contract ? true : false;
    // check_list.Closed = contract_details.is_closed ? true : false;
    check_list.buyer_agreed = false;
    check_list.seller_agreed = false;
    check_list.buyer_paid_escrow_amount = false;
    check_list.buyer_paid_brokerage = false;
    check_list.seller_paid_brokerage = false;
    check_list.execution_started = false;
    check_list.execution_ended = false;
    check_list.full_payment_released = false;
    check_list.Closed = false;

    return check_list;
}

function get_entity_to_save(entity) {

    var role_type_id = ContractRoles.Buyer.type_id;
    if (entity.creator_role) {
        if (entity.creator_role.toLowerCase() == "seller") {
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

        base_contract_amount: entity.base_contract_amount ? entity.base_contract_amount : 0,
        tax_amount: entity.base_contract_amount ? entity.base_contract_amount * AmountPercentage.Tax_Percentage : 0,
        buyer_brokerage_amount: entity.base_contract_amount ? entity.base_contract_amount * AmountPercentage.Buyer_Brokerage_Percentage : 0,
        seller_brokerage_amount: entity.base_contract_amount ? entity.base_contract_amount * AmountPercentage.Seller_Brokerage_Percentage : 0,
        current_status: ContractStatusTypes.Created.type_id,
    };
}

function get_updates(request_body) {
    let updates = {};
    console.log("request_body = ", request_body)
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
        updates.tax_amount = request_body.base_contract_amount * AmountPercentage.Tax_Percentage;
        updates.buyer_brokerage_amount = request_body.base_contract_amount * AmountPercentage.Buyer_Brokerage_Percentage;
        updates.seller_brokerage_amount = request_body.base_contract_amount * AmountPercentage.Seller_Brokerage_Percentage;
    }
    // if (request_body.hasOwnProperty('tax_amount')) {
    //     updates.tax_amount = request_body.tax_amount;
    // }
    // if (request_body.hasOwnProperty('buyer_brokerage_amount')) {
    //     updates.buyer_brokerage_amount = request_body.buyer_brokerage_amount;
    // }
    // if (request_body.hasOwnProperty('seller_brokerage_amount')) {
    //     updates.seller_brokerage_amount = request_body.seller_brokerage_amount;
    // }
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
    var buyer_details = null;
    var seller_details = null;

    if (record.buyer_contact_user_id) {
        buyer_details = await User.findByPk(record.buyer_contact_user_id);
    }

    if (record.seller_contact_user_id) {
        seller_details = await User.findByPk(record.seller_contact_user_id);
    }

    return {
        id: record.id,
        display_id: record.display_id ? record.display_id : null,
        contract_type: record.contract_type ? record.contract_type : null,
        name: record.name ? record.name : null,
        description: record.description ? record.description : null,
        creator_role: record.creator_role ? record.creator_role : null,

        is_full_payment_contract: record.is_full_payment_contract ? record.is_full_payment_contract : false,

        buyer_company_id: record.buyer_company_id ? record.buyer_company_id : null,
        buyer_contact_user_id: record.buyer_contact_user_id ? record.buyer_contact_user_id : null,
        seller_company_id: record.seller_company_id ? record.seller_company_id : null,
        seller_contact_user_id: record.seller_contact_user_id ? record.seller_contact_user_id : null,
        buyer_name: buyer_details ? buyer_details.first_name + " " + buyer_details.last_name : null,
        seller_name: seller_details ? seller_details.first_name + " " + seller_details.last_name : null,
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
        has_buyer_deposited_amount: record.has_buyer_deposited_amount ? record.has_buyer_deposited_amount : false,
        has_seller_deposited_amount: record.has_seller_deposited_amount ? record.has_seller_deposited_amount : false,

        current_status: record.current_status ? record.current_status : null,

        is_cancelled: record.is_cancelled ? record.is_cancelled : false,
        is_closed: record.is_closed ? record.is_closed : false,

        //created_by: record.created_by ? record.created_by : null,
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
