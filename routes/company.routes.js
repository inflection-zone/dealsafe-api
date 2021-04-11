const controller = require('../controllers/company.controller');
const authenticate = require('../common/authorization_handler').authenticate;


module.exports = app => {

    const router = require('express').Router();

    router.post('', authenticate, controller.authorize_create, controller.sanitize_create, controller.create);
    router.get('/search', authenticate, controller.authorize_search, controller.sanitize_search, controller.search);
    router.get('/:id', authenticate, controller.authorize_get_by_id, controller.sanitize_get_by_id, controller.get_by_id);
    router.put('/:id', authenticate, controller.authorize_update, controller.sanitize_update, controller.update);
    router.delete('/:id', authenticate, controller.authorize_delete, controller.sanitize_delete, controller.delete);


    router.get('/deleted', authenticate, controller.get_deleted);

    app.use('/api/v1/company', router);
};