const controller = require('../controllers/user.controller');
const authenticate = require('../common/authorization_handler').authenticate;
module.exports = app => {

    const router = require('express').Router();
    router.post('', controller.sanitize_create, controller.create);
    router.get('/search', authenticate, controller.authorize_search, controller.sanitize_search, controller.search);
    router.get('/:id', authenticate, controller.authorize_get_by_id, controller.sanitize_get_by_id, controller.get_by_id);
    router.get('/display-id/:displayId', authenticate, controller.authorize_get_by_id, controller.sanitize_get_by_id, controller.get_by_display_id);
    router.put('/:id', authenticate, controller.authorize_update, controller.sanitize_update, controller.update);
    router.delete('/:id', authenticate, controller.authorize_delete, controller.sanitize_delete, controller.delete);

    router.post('/generate-otp', controller.generate_otp);
    router.post('/login-otp', controller.login_with_otp);
    router.post('/login-password', controller.login_with_password);
    router.post("/change-password", authenticate, controller.authorize_change_password, controller.sanitize_change_password, controller.change_password);

    router.get('/deleted', authenticate, controller.get_deleted);

    router.post('/upload', authenticate, controller.upload_profile_picture);

    app.use('/api/v1/user', router);
};

