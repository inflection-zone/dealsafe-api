const logger = require('./logger');


module.exports.set_success_response = (response, code, message, data, logData = true) => {
    var obj = {
        status: 'success',
        message: message,
        data: data
    };
    if (logData) {
        if (process.env.NODE_ENV != 'test') {
            logger.log(JSON.stringify(obj));
        }
    }
    else {
        var tempObj = {
            status: 'success',
            message: message,
            data: null
        };
        if(process.env.NODE_ENV != 'test'){
            logger.log(JSON.stringify(tempObj));
        }
    }
    return response.status(code).send(obj);
}

module.exports.set_failure_response = (response, code, message, request = null, trace = null, error_details = null, logData = true) => {

    var tmp = trace ? trace.split('\n') : null;
    var trace_path = tmp ? tmp.map(x => x.trim()) : null;

    var obj = {
        status: 'failure',
        error: error_details,
        message: message,
        trace: trace_path,
        request: {
            host: request.hostname,
            headers: request.headers,
            body: request.body,
            method: request.method,
            url: request.originalUrl,
            params: request.params
        }
    };
    if(process.env.NODE_ENV != 'test'){
        logger.log(JSON.stringify(obj));
    }
    return response.status(code).send(obj);
}
