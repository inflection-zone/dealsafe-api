
class ServiceError extends Error {

    constructor(message, errorCode, details) {
        super(message);
        this.name = this.constructor.name;
        this.data = {
            errorCode: errorCode,
            details: details,
            trace: this.stack
        };
        Error.captureStackTrace(this, this.constructor);
    }

    stringify() {
        var obj = {
            errorType: this.name,
            message: this.message,
            data: this.data
        }
        return JSON.stringify(obj);
    };
}

module.exports.ServiceError = ServiceError
