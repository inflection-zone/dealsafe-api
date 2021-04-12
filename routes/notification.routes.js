const controller = require('../controllers/notification.controller');
const authenticate = require('../common/authorization_handler').authenticate;

module.exports = app => {

    const router = require('express').Router();

    router.get('/search', authenticate, controller.search);
    router.get('/:id', authenticate, controller.get_by_id);
    router.put('/:id', authenticate, controller.mark_as_read);

    app.use('/api/v1/notification', router);
};