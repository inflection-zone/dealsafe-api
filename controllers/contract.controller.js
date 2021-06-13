const contract_service = require('../services/contract.service');
const user_service = require('../services/user.service');
const company_service = require('../services/company.service');
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
        var entity = await extract_contract_details(req);
        const contract = await contract_service.create(entity);
        response_handler.set_success_response(res, req, 201, 'Contract added successfully!', {
            entity: contract
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        var filter = await get_search_filters(req);
        //console.log(req.query);
        //console.log("filter = ", filter);
        const entities = await contract_service.search(filter);
        response_handler.set_success_response(res, req, 200, 'Contracts retrieved successfully!', { entities: entities });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        const entity = await contract_service.get_by_id(req.params.id);
        if (entity == null) {
            response_handler.set_failure_response(res, 404, 'Contract with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        response_handler.set_success_response(res, req, 200, 'Contract retrieved successfully!', { entity: entity });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await contract_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Contract with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await contract_service.update(id, req.body);
        if (updated != null) {
            response_handler.set_success_response(res, req, 200, 'Contract updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Contract cannot be updated!');
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        var id = req.params.id;
        var exists = await contract_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Contract with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await contract_service.delete(id);
        response_handler.set_success_response(res, req, 200, 'Contract deleted successfully!', result);
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_deleted = async (req, res) => {
    try {
        const deleted_entities = await contract_service.get_deleted(req.user);
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Contracts retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.buyer_agrees = async (req, res) => {
    try {
        var id = req.params.id;
        const updated_entities = await contract_service.buyer_agrees(id, req.user);
        response_handler.set_success_response(res, req, 200, 'Contract milestone updated successfully!', {
            updated_entities: updated_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.seller_agrees = async (req, res) => {
    try {
        var id = req.params.id;
        const updated_entities = await contract_service.seller_agrees(id, req.user);
        response_handler.set_success_response(res, req, 200, 'Contract milestone updated successfully!', {
            updated_entities: updated_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.buyer_rejects = async (req, res) => {
    try {
        var id = req.params.id;
        const updated_entities = await contract_service.buyer_rejects(id, req.user);
        response_handler.set_success_response(res, req, 200, 'Contract milestone updated successfully!', {
            updated_entities: updated_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.seller_rejects = async (req, res) => {
    try {
        var id = req.params.id;
        const updated_entities = await contract_service.seller_rejects(id, req.user);
        response_handler.set_success_response(res, req, 200, 'Contract milestone updated successfully!', {
            updated_entities: updated_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.freeze_contract_details = async (req, res) => {
    try {
        var id = req.params.id;
        const updated_entities = await contract_service.freeze_contract_details(id, req.user);
        response_handler.set_success_response(res, req, 200, 'Contract milestone updated successfully!', {
            updated_entities: updated_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.buyer_deposits_escrow = async (req, res) => {
    try {
        var entity = {
            contract_id: req.params.id,
            transaction_id: req.body.transaction_id,
            amount: req.body.amount
        }
        const updated_entities = await contract_service.buyer_deposits_escrow(entity);
        response_handler.set_success_response(res, req, 200, 'Contract milestone updated successfully!', {
            updated_entities: updated_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.start_execution = async (req, res) => {
    try {
        var id = req.params.id;
        const updated_entities = await contract_service.start_execution(id, req.user);
        response_handler.set_success_response(res, req, 200, 'Contract milestone updated successfully!', {
            updated_entities: updated_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.close_contract = async (req, res) => {
    try {
        var id = req.params.id;
        const closed_entities = await contract_service.close_contract(id, req.user);
        response_handler.set_success_response(res, req, 200, 'Contract milestone updated successfully!', {
            closed_entities: closed_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

///////////////////////////////////////////////////////////////////////////////////
//Authorization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.authorize_create = async (req, res, next) => {
    try {
        req.context = 'contract.create';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_create_resource(req.user.user_id, req.body);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_search = async (req, res, next) => {
    try {
        req.context = 'contract.search';
        await authorization_handler.check_role_authorization(req.user, req.context);
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.authorize_get_by_id = async (req, res, next) => {
    try {
        req.context = 'contract.get_by_id';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_access_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_update = async (req, res, next) => {
    try {
        req.context = 'contract.update';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_delete = async (req, res, next) => {
    try {
        req.context = 'contract.delete';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_delete_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_buyer_agrees = async (req, res, next) => {
    try {
        req.context = 'contract.buyer_agrees';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_seller_agrees = async (req, res, next) => {
    try {
        req.context = 'contract.seller_agrees';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_buyer_rejects = async (req, res, next) => {
    try {
        req.context = 'contract.buyer_rejects';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_seller_rejects = async (req, res, next) => {
    try {
        req.context = 'contract.seller_rejects';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_freeze_contract_details = async (req, res, next) => {
    try {
        req.context = 'contract.freeze_contract_details';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_buyer_deposits_escrow = async (req, res, next) => {
    try {
        req.context = 'contract.buyer_deposits_escrow';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_start_execution = async (req, res, next) => {
    try {
        req.context = 'contract.start_execution';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.authorize_close_contract = async (req, res, next) => {
    try {
        req.context = 'contract.close_contract';
        await authorization_handler.check_role_authorization(req.user, req.context);
        var is_authorized = await is_user_authorized_to_update_resource(req.user.user_id, req.params.id);
        if (!is_authorized) {
            throw new ApiError('Permission denied!', null, 403);
        }
        next();
    } catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

///////////////////////////////////////////////////////////////////////////////////
//Sanitization middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.sanitize_create = async (req, res, next) => {
    try {

        await body('name', 'Contract name should be atleast 3 character long.').exists().isLength({ min: 3 }).trim().escape().run(req);
        await body('description').optional().isLength({ min: 5 }).trim().escape().run(req);
        await body('creator_role').exists().isAlpha().escape().run(req);
        await body('is_full_payment_contract', 'Please mention whether the contract payment is one-time or part-by-part').exists().isBoolean().run(req);
        // await oneOf([
        //     body('buyer_company_id').exists().isUUID(),
        //     body('buyer_contact_user_id').exists().isUUID(),
        // ]).run(req);
        // await oneOf([
        //     body('seller_company_id').exists().isUUID(),
        //     body('seller_contact_user_id').exists().isUUID(),
        // ]).run(req);
        await body('buyer_company_id').exists().isUUID().run(req);
        await body('seller_company_id').exists().isUUID().run(req);

        await body('execution_planned_start_date').exists().isDate().run(req);
        await body('execution_planned_end_date').exists().isDate().run(req);
        await body('base_contract_amount').exists().isDecimal().run(req);

        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_search = async (req, res, next) => {
    try {
        await query('name').trim().optional().escape().run(req);
        await query('my_role').trim().optional().escape().run(req);
        await query('buyer_contact_user_id').trim().optional().escape().run(req);
        await query('seller_contact_user_id').trim().optional().escape().run(req);
        await query('from').trim().optional().escape().run(req);
        await query('to').trim().optional().escape().run(req);
        if (req.query.from) {
            await query('from').isDate().trim().escape().run(req);
        }
        if (req.query.to) {
            await query('to').isDate().trim().escape().run(req);
        }
        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.sanitize_get_by_id = async (req, res, next) => {
    try {
        await param('id').exists().isUUID().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_update = async (req, res, next) => {
    try {
        await param('id').exists().isUUID().run(req);

        await body('name', 'Contract name should be atleast 3 character long.').optional().isLength({ min: 3 }).trim().escape().run(req);
        await body('description').optional().isLength({ min: 5 }).trim().escape().run(req);
        await body('creator_role').optional().isAlpha().escape().run(req);
        await body('is_full_payment_contract', 'Please mention whether the contract payment is one-time or part-by-part').optional().isBoolean().run(req);
        await body('buyer_company_id').optional().isUUID().run(req);
        await body('seller_company_id').optional().isUUID().run(req);
        await body('execution_planned_start_date').optional().isDate().run(req);
        await body('execution_planned_end_date').optional().isDate().run(req);
        await body('base_contract_amount').optional().isDecimal().run(req);

        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_delete = async (req, res, next) => {
    try {
        await param('id').exists().isUUID().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_id = async (req, res, next) => {
    try {
        await param('id').exists().isUUID().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_buyer_deposits_escrow = async (req, res, next) => {
    try {
        await param('id').exists().isUUID().run(req);
        await body('transaction_id').exists().isUUID().run(req);
        await body('amount').exists().isDecimal().run(req);
        const result = validationResult(req);
        if (!result.isEmpty()) {
            helper.handle_validation_error(result);
        }
        next();
    }
    catch (error) {
        response_handler.handle_error(error, res, req, req.context);
    }
}

///////////////////////////////////////////////////////////////////////////////////////

async function extract_contract_details(req) {

    var current_user_id = req.user.user_id;
    var created_by_user = await user_service.get_by_id(current_user_id);
    if (!created_by_user) {
        throw new ApiError('Invalid user id.', null, 404);
    }
    var creator_company_id = created_by_user.company_id;

    if (creator_company_id != req.body.buyer_company_id && creator_company_id != req.body.seller_company_id) {
        throw new ApiError('The user is not authorized to create contract for others!', null, 403);
    }
    var seller_company = await company_service.get_by_id(req.body.seller_company_id);
    if (!seller_company) {
        throw new ApiError('Seller company record not found!', null, 404);
    }
    var seller_contact_user_id = seller_company.contact_person_id;
    var buyer_company = await company_service.get_by_id(req.body.buyer_company_id);
    if (!buyer_company) {
        throw new ApiError('Buyer company record not found!', null, 404);
    }
    var buyer_contact_user_id = buyer_company.contact_person_id;

    var entity = {
        name: req.body.name,
        description: req.body.description ? req.body.description : '',
        creator_role: req.body.creator_role,
        created_by_user_id: current_user_id,
        created_date: Date.now(),
        seller_contact_user_id: seller_contact_user_id,
        seller_company_id: seller_company.id,
        buyer_contact_user_id: buyer_contact_user_id,
        buyer_company_id: buyer_company.id,
        is_full_payment_contract: req.body.is_full_payment_contract,
        execution_planned_start_date: req.body.execution_planned_start_date,
        execution_planned_end_date: req.body.execution_planned_end_date,
        base_contract_amount: req.body.base_contract_amount,
    };
    return entity;
}

async function get_search_filters(req) {
    var filter = {};
    var current_user_id = req.user.user_id;
    var current_user = await user_service.get_by_id(current_user_id);
    var current_user_company_id = current_user.company_id;
    filter['current_user_company_id'] = current_user_company_id;

    var my_role = req.query.my_role ? req.query.my_role : null;
    if (my_role != null) {
        filter['my_role'] = req.query.my_role;
    }

    var name = req.query.name ? req.query.name : null;
    if (name != null) {
        filter['name'] = name;
    }

    var buyer_contact_user_id = req.query.buyer_contact_user_id ? req.query.buyer_contact_user_id : null;
    if (buyer_contact_user_id != null) {
        filter['buyer_contact_user_id'] = buyer_contact_user_id;
    }

    var seller_contact_user_id = req.query.seller_contact_user_id ? req.query.seller_contact_user_id : null;
    if (seller_contact_user_id != null) {
        filter['seller_contact_user_id'] = seller_contact_user_id;
    }

    var name = req.query.name ? req.query.name : null;
    if (name != null) {
        filter['name'] = name;
    }

    var from_date = req.query.from ? req.query.from : null;
    var to_date = req.query.to ? req.query.to : null;
    if (from_date != null && to_date != null) {
        filter['from_date'] = from_date;
        filter['to_date'] = to_date;
    }

    var company_name = req.query.company ? req.query.company : null;
    if (company_name != null) {
        filter['company'] = company_name;
    }

    var sort_type = req.query.sort_type ? req.query.sort_type : 'descending';
    var sort_by = req.query.sort_by ? req.query.sort_by : 'created_date';
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
