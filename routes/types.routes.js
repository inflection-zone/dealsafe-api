const controller = require('../controllers/types.controller');

module.exports = app => {

    const router = require('express').Router();
    
    router.get("/user-roles", controller.get_user_roles);
    router.get("/contract-roles", controller.get_contract_roles);

    router.get("/bank-account-types", controller.get_bank_account_types);
    router.get("/contract-payment-modes", controller.get_contract_payment_modes);
    router.get("/contract-status-types", controller.get_contract_status_types);
    router.get("/transaction-types", controller.get_transaction_types);
    router.get("/transaction-status-types", controller.get_transaction_status_types);
    
    router.get("/city/:pincode", controller.get_city_by_pincode);
    router.get("/pincode/:city", controller.get_pincode_by_city);
    router.get("/cities-in-state/:state", controller.get_cities_by_state);
    router.get("/states", controller.get_states);

    app.use('/api/v1/types', router);
};
