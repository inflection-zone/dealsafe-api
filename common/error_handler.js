const response_handler = require('./response_handler');
const ServiceError = require('./service_error').ServiceError;
////////////////////////////////////////////////////////////////////////////////

module.exports.handle_controller_error = (error, res, req) => {

    var message = '';
    var errorCode = 500;
    var request = req;
    var trace = null;
    var details = null;

    if (error.hasOwnProperty('message')) {
        message = error.message;
    }
    if (error.hasOwnProperty('data')) {
        data = error.data;
        if (data != null) {
            trace = error.data.trace;
            if (data.hasOwnProperty('errorCode')) {
                errorCode = error.data.errorCode;
            }
            if (data.hasOwnProperty('details')) {
                details = error.data.details;
            }
        }
        if (error.hasOwnProperty('Stringify')) {
            trace = error.Stringify();
        }
    }
    response_handler.set_failure_response(res, errorCode, message, request, trace, details);
}

module.exports.throw_service_error = (error, msg) => {
    if (error instanceof ServiceError) {
        throw error;
    }
    else {
        throw new ServiceError(msg, 200, error.message);
    }
}
