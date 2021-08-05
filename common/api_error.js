
class ApiError extends Error {

    constructor(message, http_error_code = null, api_error_code = null, trace = null) {
        super(message);
        //Object.setPrototypeOf(this, new.target.prototype);
        this.error_type = this.constructor.name;
        this.http_error_code = http_error_code ? http_error_code : 500;
        this.api_internal_error_code = api_error_code;

        var tmp_trace = trace ? trace : this.stack;
        var trace_array = tmp_trace ? tmp_trace.split('\n') : null;
        var trace_path = trace_array ? trace_array.map(x => x.trim()) : null;
        this.trace = trace_path;

        Error.captureStackTrace(this, this.constructor);
    }

    stringify() {
        var obj = {
            error_type: this.error_type,
            message: this.message,
            http_error_code: this.http_error_code,
            api_error_code: this.api_error_code,
            trace: this.trace,
        }
        return JSON.stringify(obj);
    };

}

module.exports.ApiError = ApiError
