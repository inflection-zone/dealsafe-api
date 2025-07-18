const types_service = require('../services/types.service');
const helper = require('../common/helper');
const logger = require('../common/logger');
const response_handler = require('../common/response_handler');
const { ApiError } = require('../common/api_error');
const _ = require('lodash');
const { query, body, oneOf, validationResult, param } = require('express-validator');

////////////////////////////////////////////////////////////////////////

exports.get_user_roles = async (req, res) => {
    try {
        const types = await types_service.get_user_roles();
        response_handler.set_success_response(res, req, 200, 'User role types retrieved successfully!', { types: types });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_contract_roles = async (req, res) => {
    try {
        const types = await types_service.get_contract_roles();
        response_handler.set_success_response(res, req, 200, 'Contract role types retrieved successfully!', { types: types });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_bank_account_types = async (req, res) => {
    try {
        const types = await types_service.get_bank_account_types();
        response_handler.set_success_response(res, req, 200, 'Bank account types retrieved successfully!', { types: types });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_contract_payment_modes = async (req, res) => {
    try {
        const types = await types_service.get_contract_payment_modes();
        response_handler.set_success_response(res, req, 200, 'Contract payment modes retrieved successfully!', { types: types });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_contract_status_types = async (req, res) => {
    try {
        const types = await types_service.get_contract_status_types();
        response_handler.set_success_response(res, req, 200, 'Contract status types retrieved successfully!', { types: types });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_transaction_types = async (req, res) => {
    try {
        const types = await types_service.get_transaction_types();
        response_handler.set_success_response(res, req, 200, 'Transaction types retrieved successfully!', { types: types });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_transaction_status_types = async (req, res) => {
    try {
        const types = await types_service.get_transaction_status_types();
        response_handler.set_success_response(res, req, 200, 'Transaction status types retrieved successfully!', { types: types });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

//////////////////////////////////////////////////////////////////////////////////////

exports.get_city_by_pincode = async (req, res) => {
    try {
        var pincode = req.params.pincode;
        const city = await types_service.get_city_by_pincode(pincode);
        response_handler.set_success_response(res, req, 200, 'Cities retrieved successfully!', { entity: city });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.get_pincode_by_city = async (req, res) => {
    try {
        var city = req.params.city;
        const pincodes = await types_service.get_pincode_by_city(city);
        response_handler.set_success_response(res, req, 200, 'Pincodes retrieved successfully!', { entities: pincodes });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

exports.get_cities_by_state = async (req, res) => {
    try {
        var state = req.params.state;
        const states = await types_service.get_cities_by_state(state);
        response_handler.set_success_response(res, req, 200, 'Cities for the state retrieved successfully!', { entities: states });
    }
    catch (error) {
       response_handler.handle_error(error, res, req);
    }
}

exports.get_states = async (req, res) => {
    try {
        const states = await types_service.get_states();
        response_handler.set_success_response(res, req, 200, 'States retrieved successfully!', { entities: states });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}

//////////////////////////////////////////////////////////////////////////////////////
