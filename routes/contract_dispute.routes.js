const controller = require('../controllers/contract_dispute.controller');
const authenticate = require('../common/authorization_handler').authenticate;

module.exports = app => {

    const router = require('express').Router();

    router.post('', authenticate, controller.create);
    router.get('/search', authenticate, controller.search);
    router.get('/:id', authenticate, controller.get_by_id);
    router.put('/:id', authenticate, controller.update);
    router.delete('/:id', authenticate, controller.delete);


    router.get('/deleted', authenticate, controller.get_deleted);

    app.use('/api/v1/contract-dispute', router);
};