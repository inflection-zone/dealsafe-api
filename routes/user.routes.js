const controller = require('../controllers/user.controller');
const authenticate = require('../common/authorization_handler').authenticate;

module.exports = app => {

    const router = require('express').Router();

    router.post('', authenticate, controller.create);
    router.get('/all', authenticate, controller.get_all);
    router.get('/:id', authenticate, controller.get_by_id);
    router.get('/display-id/:displayId', authenticate, controller.get_by_display_id);
    router.put('/:id', authenticate, controller.update);
    router.delete('/:id', authenticate, controller.delete);

    router.post('/generate-otp', controller.generate_otp);
    router.post('/login-otp', controller.login_with_otp);
    router.post('/login', controller.login);
    router.post("/change-password", authenticate, controller.change_password);
    
    router.get('/deleted', authenticate, controller.get_deleted);

    app.use('/api/v1/user', router);
};