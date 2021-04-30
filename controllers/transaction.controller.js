const transaction_service = require('../services/transaction.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');
const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const { ApiError } = require('../common/api_error');
const _ = require('lodash');
const { query, body, oneOf, validationResult, param } = require('express-validator');

////////////////////////////////////////////////////////////////////////

exports.create = async (req, res) => {
    try {
        const entity = await transaction_service.create(req.body);
        response_handler.set_success_response(res, req, 201, 'Transaction added successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        var filter = await get_search_filters(req);
        const entities = await transaction_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Transactions retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await transaction_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Transaction with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await transaction_service.get_by_id(id);
        response_handler.set_success_response(res, req, 200, 'Transaction retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await transaction_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Transaction with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await transaction_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'Transaction updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Transaction cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await transaction_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Transaction with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await transaction_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'Transaction deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_deleted = async (req, res) => {
    try {
        const deleted_entities = await transaction_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Transactions retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_summary = async (req, res) => {
    try {
        const transaction_entities = await transaction_service.get_summary(req.user);
        response_handler.set_success_response(res, req, 200, 'Transaction summary retrieved successfully!', {
            transaction_entities: transaction_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

///////////////////////////////////////////////////////////////////////////////////
//Authorization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.authorize_create = async (req, res, next) => {
    try{
        req.context = 'transaction.create';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_create_resource(req.user.user_id, req.body);
        if (!is_authorized) {
            throw new ApiError('Permission denied', 403);
        }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_search = async (req, res, next) => {
    try{
        req.context = 'transaction.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try{
        req.context = 'transaction.get_by_id';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_access_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied', 403);
        }
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_update = async (req, res, next) => {
    try{
        req.context = 'transaction.update';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied', 403);
        }
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_delete = async (req, res, next) => {
    try{
        req.context = 'transaction.delete';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_delete_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', 403);
        }
        next();
    } catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

///////////////////////////////////////////////////////////////////////////////////
//Sanitization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.sanitize_create = async (req, res, next) => {
    try{
        await body('transaction_reference_id').exists().isAlphanumeric().trim().escape().run(req);
        await body('escrow_bank_reference_id').exists().isAlphanumeric().trim().escape().run(req);
        await body('contract_id').exists().isUUID().trim().escape().run(req);
        await body('milestone_id').isUUID().trim().escape().run(req);
        await body('paid_by_company_id').exists().isUUID().trim().escape().run(req);
        await body('paid_to_company_id').exists().isUUID().trim().escape().run(req);
        await body('pay_from_account_number').isAlphanumeric().trim().escape().run(req);
        await body('pay_to_account_number').isAlphanumeric().trim().escape().run(req);
        await body('transaction_amount').exists().isDecimal().trim().escape().run(req);
        await body('transaction_date').exists().toDate().isDate().trim().escape().run(req);
        await body('payment_request_id').isUUID().trim().escape().run(req);
        await body('transaction_initiated_by').exists().isUUID().trim().escape().run(req);
        await body('currency').isAlpha().trim().escape().run(req);
        await body('remarks').isAlphanumeric().trim().escape().run(req);
        
        const result = validationResult(req);
        if(!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_search = async (req, res, next) => {
    try{
        await query('company_id').isUUID().trim().escape().run(req);
        const result = validationResult(req);
        if(!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_get_by_id =  async (req, res, next) => {
    try{
        await param('id').exists().isUUID().run(req);
        const result = validationResult(req);
        if(!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_update =  async (req, res, next) => {
    try{
        await param('id').exists().isUUID().run(req);
        await body('transaction_reference_id').isAlphanumeric().trim().escape().run(req);
        await body('escrow_bank_reference_id').isAlphanumeric().trim().escape().run(req);
        await body('contract_id').isUUID().trim().escape().run(req);
        await body('milestone_id').isUUID().trim().escape().run(req);
        await body('paid_by_company_id').isUUID().trim().escape().run(req);
        await body('paid_to_company_id').isUUID().trim().escape().run(req);
        await body('pay_from_account_number').isAlphanumeric().trim().escape().run(req);
        await body('pay_to_account_number').isAlphanumeric().trim().escape().run(req);
        await body('transaction_amount').isDecimal().trim().escape().run(req);
        await body('transaction_date').toDate().isDate().trim().escape().run(req);
        await body('payment_request_id').isUUID().trim().escape().run(req);
        await body('transaction_initiated_by').isUUID().trim().escape().run(req);
        await body('currency').isAlpha().trim().escape().run(req);
        await body('remarks').isAlphanumeric().trim().escape().run(req);
        const result = validationResult(req);
        if(!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_delete =  async (req, res, next) => {
    try{
        await param('id').exists().isUUID().run(req);
        const result = validationResult(req);
        if(!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

///////////////////////////////////////////////////////////////////////////////////////

function get_search_filters(req) {

    var filter = {};

    var contract_id = req.query.contract_id ? req.query.contract_id : null;
    if (contract_id != null) {
        filter['contract_id'] = contract_id;
    }
    var milestone_id = req.query.milestone_id ? req.query.milestone_id : null;
    if (milestone_id != null) {
        filter['milestone_id'] = milestone_id;
    }
    var paid_by_company_id = req.query.paid_by_company_id ? req.query.paid_by_company_id : null;
    if (paid_by_company_id != null) {
        filter['paid_by_company_id'] = paid_by_company_id;
    }
    var paid_to_company_id = req.query.paid_to_company_id ? req.query.paid_to_company_id : null;
    if (paid_to_company_id != null) {
        filter['paid_to_company_id'] = paid_to_company_id;
    }
    var transaction_initiated_by = req.query.transaction_initiated_by ? req.query.transaction_initiated_by : null;
    if (transaction_initiated_by != null) {
        filter['transaction_initiated_by'] = transaction_initiated_by;
    }
    var from_transaction_date = req.query.from_transaction_date ? req.query.from_transaction_date : null;
    var to_transaction_date = req.query.to_transaction_date ? req.query.to_transaction_date : null;
    if (from_transaction_date != null && to_transaction_date != null) {
        filter['from_transaction_date'] = from_transaction_date;
        filter['to_transaction_date'] = to_transaction_date;
    }

    var transaction_status = req.query.transaction_status ? req.query.transaction_status : null;
    if (transaction_status != null) {
        filter['transaction_status'] = transaction_date;
    }

    var sort_type = req.query.sort_type ? req.query.sort_type : 'descending';
    var sort_by = req.query.sort_by ? req.query.sort_by : 'transaction_date';
    filter['sort_type'] = sort_type;
    filter['sort_by'] = sort_by;

    var page_number = req.query.page_number ? req.query.page_number : 1;
    var items_per_page = req.query.items_per_page ? req.query.items_per_page : 10;
    filter['page_number'] = page_number;
    filter['items_per_page'] = items_per_page;

    return filter;
}

///////////////////////////////////////////////////////////////////////////////////////

async function is_user_authorized_to_create_resource(user_id, request_body) {
    return true;
}

async function is_user_authorized_to_access_resource(user_id, resource_id) {
    return true;
}

async function is_user_authorized_to_update_resource(user_id, resource_id) {
    return true;
}

async function is_user_authorized_to_delete_resource(user_id, resource_id) {
    return true;
}

///////////////////////////////////////////////////////////////////////////////////////
