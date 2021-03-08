const controller = require('../controllers/resource.controller');
const authenticate = require('../common/authorization_handler').authenticate;

module.exports = app => {

    const router = require('express').Router();

    router.post('/upload', authenticate, controller.upload);
    router.get('/download/:resource_id', authenticate, controller.download);
    router.get('/download-public/:resource_id', controller.download_public);
    router.delete('/delete/:resource_id', authenticate, controller.delete);
    router.get('/download-by-reference/:reference_item_id', authenticate, controller.download_by_reference);
    router.get('/get-by-reference/:reference_item_id', authenticate, controller.get_resources_by_reference);
    router.delete('/delete-by-reference/:reference_item_id', authenticate, controller.delete_by_reference);
    router.put('/update-reference/:resource_id', authenticate, controller.update_resource_reference);

    app.use('/api/v1/resources', router);

};
