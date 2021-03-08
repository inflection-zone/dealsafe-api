const types_service = require('../services/types.service');
const helper = require('../common/helper');
const logger = require('../common/logger');
const response_handler = require('../common/response_handler');
const error_handler = require('../common/error_handler');
const activity_handler = require('../common/activity_handler');

exports.get_role_types = async (req, res) => {
    try {
        const types = await types_service.get_role_types();
        activity_handler.record_activity(req.user, 'types.get_role_types', req, res, 'Role');
        response_handler.set_success_response(res, 200, 'Role types retrieved successfully!', { types: types });
    }
    catch (error) {
        activity_handler.record_activity(req.user, 'types.get_role_types', req, res, 'Role', error);
        error_handler.handle_controller_error(error, res, req);
    }
};

exports.get_city_by_pincode = async (req, res) => {
    try {
        var pincode = req.params.pincode;
        const city = await types_service.get_city_by_pincode(pincode);
        activity_handler.record_activity(req.user, 'types.get_city_by_pincode', req, res, 'Geographical location');
        response_handler.set_success_response(res, 200, 'Cities retrieved successfully!', { entity: city });
    }
    catch (error) {
        activity_handler.record_activity(req.user, 'types.get_city_by_pincode', req, res, 'Geographical location', error);
        error_handler.handle_controller_error(error, res, req);
    }
}

exports.get_pincode_by_city = async (req, res) => {
    try {
        var city = req.params.city;
        const pincodes = await types_service.get_pincode_by_city(city);
        activity_handler.record_activity(req.user, 'types.get_pincode_by_city', req, res, 'Geographical location');
        response_handler.set_success_response(res, 200, 'Pincodes retrieved successfully!', { entities: pincodes });
    }
    catch (error) {
        activity_handler.record_activity(req.user, 'types.get_pincode_by_city', req, res, 'Geographical location', error);
        error_handler.handle_controller_error(error, res, req);
    }
}

exports.get_cities_by_state = async (req, res) => {
    try {
        var state = req.params.state;
        const states = await types_service.get_cities_by_state(state);
        activity_handler.record_activity(req.user, 'types.get_cities_by_state', req, res, 'Geographical location');
        response_handler.set_success_response(res, 200, 'Cities for the state retrieved successfully!', { entities: states });
    }
    catch (error) {
        activity_handler.record_activity(req.user, 'types.get_cities_by_state', req, res, 'Geographical location', error);
        error_handler.handle_controller_error(error, res, req);
    }
}

exports.get_states = async (req, res) => {
    try {
        const states = await types_service.get_states();
        activity_handler.record_activity(req.user, 'types.get_states', req, res, 'Geographical location');
        response_handler.set_success_response(res, 200, 'States retrieved successfully!', { entities: states });
    }
    catch (error) {
        activity_handler.record_activity(req.user, 'types.get_states', req, res, 'Geographical location', error);
        error_handler.handle_controller_error(error, res, req);
    }
}
