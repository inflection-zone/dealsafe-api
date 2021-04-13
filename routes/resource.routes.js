const controller = require('../controllers/resource.controller');
const authenticate = require('../common/authorization_handler').authenticate;

module.exports = app => {

    const router = require('express').Router();

    router.post('/upload', authenticate, controller.authorize_upload, controller.sanitize_upload, controller.upload);
    router.get('/download/:resource_id', authenticate, controller.authorize_download, controller.sanitize_download, controller.download);
    router.get('/download-public/:resource_id', controller.sanitize_download, controller.download_public);
    router.get('/download-by-reference/:reference_item_id', authenticate, controller.authorize_download_by_reference, controller.sanitize_download_by_reference, controller.download_by_reference);
    router.delete('/delete/:resource_id', authenticate, controller.authorize_delete, controller.sanitize_delete, controller.delete);

    router.get('/get-by-reference/:reference_item_id', authenticate, controller.authorize_get_by_reference, controller.sanitize_get_by_reference, controller.get_resources_by_reference);
    router.delete('/delete-by-reference/:reference_item_id', authenticate, controller.authorize_delete_by_reference, controller.sanitize_delete_by_reference, controller.delete_by_reference);
    router.put('/update-reference/:resource_id', authenticate, controller.authorize_update_reference, controller.sanitize_update_reference, controller.update_resource_reference);

    app.use('/api/v1/resources', router);

};
