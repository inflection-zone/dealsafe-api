const logger = require('./logger');
const activity_handler = require('./activity_handler');
const { ApiError } = require('./api_error');

//////////////////////////////////////////////////////////////

exports.set_success_response = (response, request, response_code, message, data, logData = true) => {
    var response_object = {
        status: 'success',
        message: message,
        response_code: response_code,
        data: data ? data : null,
        api_version: process.env.API_VERSION,
        service_version: process.env.SERVICE_VERSION
    };
    var request_object = {
        host: request.hostname,
        headers: request.headers,
        body: request.body,
        method: request.method,
        url: request.originalUrl,
        params: request.params,
        client_ip: request.client_ip,
    };
    if (process.env.NODE_ENV != 'test') {
        var obj = {
            status: 'success',
            message: message,
            response_code: response_code
        };
        if (logData) {
            obj = response_object;
        }
        logger.log(JSON.stringify(obj, null, 2));
    }
    activity_handler.record_activity(request_object, response_object, null);
    return response.status(response_code).send(response_object);
}

exports.set_failure_response = (response, request, error = null) => {
//exports.set_failure_response = (response, response_code, message, request) => {

    var response_code = error.http_error_code || 500;
    //var response_code = response_code ? response_code : 500;

    var obj = {
        status: 'failure',
        message: error? error.message : message,
        //message: message,
        api_error_code: error ? error.api_internal_error_code : null,
        //api_error_code: response_code,
        trace: error ? error.trace : null,
        request: {
            context: request.context ? request.context : null,
            user_id: request.user ? request.user.user_id : null,
            user_full_name: request.user ? request.user.first_name + ' ' + request.user.last_name : 'unknown: <public route>',
            host: request.hostname,
            headers: request.headers,
            body: request.body,
            method: request.method,
            url: request.originalUrl,
            params: request.params,
            client_ip: request.client_ip
        },
        api_version: process.env.API_VERSION,
        service_version: process.env.SERVICE_VERSION
    };
    if (process.env.NODE_ENV != 'test') {
        console.log(obj);
        //logger.log(JSON.stringify(obj, null, 2));
    }
    return response.status(response_code).send(obj);
}

exports.handle_error = (error, res, req) => {
    if (error instanceof ApiError) {
        var api_error = new ApiError(error.message, 500, error.api_internal_error_code, error.stack);
        activity_handler.record_activity(req, res, api_error);
        exports.set_failure_response(res, req, api_error);
    }
    else {
        activity_handler.record_activity(req, res, error);
        exports.set_failure_response(res, req, error);
    }
}
