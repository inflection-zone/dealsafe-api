const controller = require('../controllers/contract.controller');
const authenticate = require('../common/authorization_handler').authenticate;

module.exports = app => {
    const router = require('express').Router();
    router.post('', authenticate, controller.authorize_create, controller.sanitize_create, controller.create);
    router.get('/search', authenticate, controller.authorize_search, controller.sanitize_search, controller.search);
    router.get('/summary', authenticate, controller.authorize_get_summary_by_creator_role, controller.sanitize_get_summary_by_creator_role, controller.get_summary_by_creator_role);
    router.get('/:id', authenticate, controller.authorize_get_by_id, controller.sanitize_get_by_id, controller.get_by_id);
    router.put('/:id', authenticate, controller.authorize_update, controller.sanitize_update, controller.update);
    router.delete('/:id', authenticate, controller.authorize_delete, controller.sanitize_delete, controller.delete);
    router.get('/deleted', authenticate, controller.get_deleted);
 
    router.put('/buyer-agrees/:id', authenticate, controller.authorize_buyer_agrees, controller.sanitize_id, controller.buyer_agrees);
    router.put('/seller-agrees/:id', authenticate, controller.authorize_seller_agrees, controller.sanitize_id, controller.seller_agrees);
    router.put('/buyer-rejects/:id', authenticate, controller.authorize_buyer_rejects, controller.sanitize_id, controller.buyer_rejects);
    router.put('/seller-rejects/:id', authenticate, controller.authorize_seller_rejects, controller.sanitize_id, controller.seller_rejects);
    
    //pending freeze-contract-details and buyer-deposits-escrow
    router.put('/freeze-contract-details/:id', authenticate, controller.authorize_freeze_contract_details, controller.sanitize_id, controller.freeze_contract_details);
    router.put('/buyer-deposits-escrow/:id', authenticate, controller.authorize_buyer_deposits_escrow, controller.sanitize_buyer_deposits_escrow, controller.buyer_deposits_escrow);
    
    router.put('/start-execution/:id', authenticate, controller.authorize_start_execution, controller.sanitize_id, controller.start_execution);
    router.put('/close/:id', authenticate, controller.authorize_close_contract, controller.sanitize_id, controller.close_contract);

    app.use('/api/v1/contract', router);
};