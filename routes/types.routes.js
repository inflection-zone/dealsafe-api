const controller = require('../controllers/types.controller');

module.exports = app => {

    const router = require('express').Router();
    
    router.get("/role-types", controller.get_role_types);

    router.get("/city/:pincode", controller.get_city_by_pincode);
    router.get("/pincode/:city", controller.get_pincode_by_city);
    router.get("/cities-in-state/:state", controller.get_cities_by_state);
    router.get("/states", controller.get_states);

    app.use('/api/v1/types', router);
};
