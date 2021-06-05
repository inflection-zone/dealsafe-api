const controller = require('../controllers/notification.controller');
const authenticate = require('../common/authorization_handler').authenticate;

module.exports = app => {

    const router = require('express').Router();
    router.get('/search', authenticate, controller.authorize_search, controller.sanitize_search, controller.search);
    router.get('/:id', authenticate, controller.authorize_get_by_id, controller.sanitize_get_by_id, controller.get_by_id);
    router.put('/:id', authenticate, controller.authorize_mark_as_read, controller.sanitize_mark_as_read, controller.mark_as_read);
    app.use('/api/v1/notification', router);
};