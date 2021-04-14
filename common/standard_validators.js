const { ApiError } = require('../common/api_error');
const { query, body, oneOf, validationResult, param } = require('express-validator');

////////////////////////////////////////////////////////////////////////////////

exports.validateGSTN = (value, { req, location, path  }) => {
    var regx = new RegExp('^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$');
    var is_valid = regx.test(value);
    if (!is_valid) {
        throw new ApiError('Invalid GST number.', 422);
    } else {
        return true;
    }
}

exports.validatePAN = (value, { req, location, path  }) => {
    var regx = new RegExp('[A-Z]{5}[0-9]{4}[A-Z]{1}');
    var is_valid = regx.test(value);
    if (!is_valid) {
        throw new ApiError('Invalid PAN number.', 422);
    } else {
        return true;
    }
}

exports.validateTAN = (value, { req, location, path  }) => {
    var regx = new RegExp('[A-Z]{4}[0-9]{5}[A-Z]{1}');
    var is_valid = regx.test(value);
    if (!is_valid) {
        throw new ApiError('Invalid TAN number.', 422);
    } else {
        return true;
    }
}

exports.validateBankIFSC = (value, { req, location, path  }) => {
    var regx = new RegExp('^[A-Z]{4}0[A-Z0-9]{6}$');
    var is_valid = regx.test(value);
    if (!is_valid) {
        throw new ApiError('Invalid Bank IFSC code.', 422);
    } else {
        return true;
    }
}

