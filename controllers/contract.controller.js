const contract_service = require('../services/contract.service');
const user_service = require('../services/user.service');
const helper = require('../common/helper');
const response_handler = require('../common/response_handler');

const logger = require('../common/logger');
const authorization_handler = require('../common/authorization_handler');
const activity_handler = require('../common/activity_handler');
const { ApiError } = require('../common/api_error');
const _ = require('lodash');
const { check, body, oneOf, validationResult } = require('express-validator');

exports.create = async (req, res) => {
    try {
        var context = 'contract.create';

        // if (
        //     !req.body.name || 
        //     !req.body.creator_role ||
        //     !req.body.is_full_payment_contract) {
        //     throw new ApiError('Missing required parameters.', 412);
        // }
        // if (!req.body.other_party_contact_user_id &&
        //     !req.body.other_party_company_id) {
        //         throw new ApiError('Missing other party details.', 412);
        // }
        var created_by_user_id = req.user.user_id;

        var seller_contact_user_id = null;
        var seller_company_id = null;
        var buyer_contact_user_id = null;
        var buyer_company_id = null;
        
        var creator_role = req.body.creator_role;
        if(creator_role.toLowerCase() == 'buyer') {
            buyer_contact_user_id = created_by_user_id;
            var buyer_user = await user_service.get_by_id(created_by_user_id);
            if(!buyer_user){
                throw new ApiError('Invalid buyer user id.', 404);
            }
            buyer_company_id = buyer_user.company_id;
            if(other_party_company_id) {
                var other_party_company = await company_service.get_by_id(other_party_company_id);
                if(!other_party_company){
                    throw new ApiError('Invalid other party company id.', 404);
                }
                seller_company_id = other_party_company.id;
                seller_contact_user_id = other_party_company.contact_person_id;
            }
        }
        else {
            seller_contact_user_id = created_by_user_id;
            var seller_user = await user_service.get_by_id(created_by_user_id);
            if(!seller_user){
                throw new ApiError('Invalid seller user id.', 404);
            }
            seller_company_id = seller_user.company_id;
            if(other_party_company_id) {
                var other_party_company = await company_service.get_by_id(other_party_company_id);
                if(!other_party_company){
                    throw new ApiError('Invalid other party company id.', 404);
                }
                buyer_company_id = other_party_company.id;
                buyer_contact_user_id = other_party_company.contact_person_id;
            }
        }
        var entity = {
            name: req.body.name,
            seller_contact_user_id: seller_contact_user_id,
            seller_company_id: seller_company_id,
            buyer_contact_user_id: buyer_contact_user_id,
            buyer_company_id: buyer_company_id
        };

        const contract = await contract_service.create(entity);
        activity_handler.record_activity(req.user, 'contract.create', req, res, 'Contract');
        response_handler.set_success_response(res, req, 201, 'Contract added successfully!', {
            entity: contract
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'contract.create', req, res, 'Contract', error);
        response_handler.handle_error(error, res, req);
    }
};

exports.search = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract.search', req, res)) {
            return;
        }
        var filter = get_search_filters(req);
        const entities = await contract_service.search(filter);
        activity_handler.record_activity(req.user, 'contract.search', req, res, 'Contract');
        response_handler.set_success_response(res, req, 200, 'Contracts retrieved successfully!', {
            entities: entities
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'contract.search', req, res, 'Contract', error);
        response_handler.handle_error(error, res, req);
    }
};

exports.get_by_id = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract.get_by_id', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await contract_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Contract with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        const entity = await contract_service.get_by_id(id);
        activity_handler.record_activity(req.user, 'contract.get_by_id', req, res, 'Contract');
        response_handler.set_success_response(res, req, 200, 'Contract retrieved successfully!', {
            entity: entity
        });
    } catch (error) {
        activity_handler.record_activity(req.user, 'contract.get_by_id', req, res, 'Contract', error);
        response_handler.handle_error(error, res, req);
    }
};

exports.update = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract.update', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await contract_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Contract with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var updated = await contract_service.update(id, req.body);
        if (updated != null) {
            activity_handler.record_activity(req.user, 'contract.update', req, res, 'Contract');
            response_handler.set_success_response(res, req, 200, 'Contract updated successfully!', {
                updated: updated
            });
            return;
        }
        throw new Error('Contract cannot be updated!');
    } catch (error) {
        activity_handler.record_activity(req.user, 'contract.update', req, res, 'Contract', error);
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (!await authorization_handler.check_role_authorization('contract.delete', req, res)) {
            return;
        }
        var id = req.params.id;
        var exists = await contract_service.exists(id);
        if (!exists) {
            response_handler.set_failure_response(res, 404, 'Contract with id ' + id.toString() + ' cannot be found!', req);
            return;
        }
        var result = await contract_service.delete(id);
        activity_handler.record_activity(req.user, 'contract.delete', req, res, 'Contract');
        response_handler.set_success_response(res, req, 200, 'Contract deleted successfully!', result);
    } catch (error) {
        activity_handler.record_activity(req.user, 'contract.delete', req, res, 'Contract', error);
        response_handler.handle_error(error, res, req);
    }
};


exports.get_deleted = async (req, res) => {
    var context = 'contract.get_deleted';
    try {
        if (!await authorization_handler.check_role_authorization('contract.get_deleted', req, res)) {
            return;
        }
        const deleted_entities = await contract_service.get_deleted(req.user);
        activity_handler.record_activity(req.user, 'contract.get_deleted', req, res, 'Contract');
        response_handler.set_success_response(res, req, 200, 'Deleted instances of Contracts retrieved successfully!', {
            deleted_entities: deleted_entities
        });
    } catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

function get_search_filters(req) {
    var filter = {};
    //var name = req.query.name ? req.query.name : null;
    // if (name != null) {
    //     filter['name'] = name;
    // }
    return filter;
}

///////////////////////////////////////////////////////////////////////////////////
//Middleware functions
///////////////////////////////////////////////////////////////////////////////////

exports.authorize_create = async (req, res, next) => {
    try{
        req.context = 'contract.create';
        await authorization_handler.check_role_authorization(req.user, req.context);
        //Perform other authorization checks here...

        //Move on...
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

exports.sanitize_create = async (req, res, next) => {
    try{

        await body('name', 'Contract name should be atleast 3 character long.').exists().isLength({ min: 3 }).trim().escape().run(req);
        await body('creator_role').exists().isAlpha().escape().run(req);
        await body('is_full_payment_contract', 'Please mention whether the contract payment is one-time or part-by-part').exists().isBoolean().run(req);
        await oneOf([
            body('buyer_company_id').exists().isUUID(),
            body('buyer_contact_user_id').exists().isUUID(),
        ]).run(req);
        await oneOf([
            body('seller_company_id').exists().isUUID(),
            body('seller_contact_user_id').exists().isUUID(),
        ]).run(req);
        await body('execution_planned_start_date').exists().isDate().run(req);
        await body('execution_planned_end_date').exists().isDate().run(req);
        await body('base_contract_amount').exists().isDecimal().run(req);
        
        const result = validationResult(req);
        if(!result.isEmpty()) {
            result.throw();
        }
        next();
    }
    catch(error){
        response_handler.handle_error(error, res, req, req.context);
    }
}

