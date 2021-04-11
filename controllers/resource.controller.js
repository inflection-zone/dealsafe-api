const resource_service = require('../services/resource.service');
const response_handler = require('../common/response_handler');

////////////////////////////////////////////////////////////////////////
var path = require('path');
var mime = require('mime');
var fs = require('fs');
const admzip = require('adm-zip');
const authorization_handler = require('../common/authorization_handler');

exports.upload = async (req, res) => {
    try {
        if (! await authorization_handler.check_role_authorization('resource.upload', req, res)) {
            return;
        }
        var user_id = null;
        if (req.user != null) {
            user_id = req.user.user_id;
        }
        if (!req.files) {
            response_handler.set_failure_response(res, 400, 'No file uploaded!',req);
            return;
        }
        var reference_item_id = req.body.reference_item_id ? req.body.reference_item_id : null;
        var is_public = req.body.public ? req.body.public : false;
        var details = await resource_service.upload(user_id, req.files, is_public, reference_item_id);
        response_handler.set_success_response(res, req, 200, 'File/s uploaded successfully!', { details: details });
    }
    catch (error) {
       response_handler.handle_error(error, res, req);
    }
};

exports.download = async (req, res) => {
    try {
        if (! await authorization_handler.check_role_authorization('resource.download', req, res)) {
            return;
        }
        const resource_id = req.params.resource_id;
        var resource = await resource_service.get_resource_by_id(resource_id);
        if (resource == null) {
            response_handler.set_failure_response(res, 404, 'Invalid resource Id!');
            return;
        }
        var local_destination = await resource_service.download(resource);

        var filename = path.basename(local_destination);
        var mime_type = mime.getType(local_destination);
        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', mime_type);
        var filestream = fs.createReadStream(local_destination);
        filestream.pipe(res);

        //res.sendFile(local_destination);

    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.download_public = async (req, res) => {
    try {
        const resource_id = req.params.resource_id;
        var resource = await resource_service.get_resource_by_id(resource_id);
        if (resource == null) {
            response_handler.set_failure_response(res, 404, 'Invalid resource Id!');
            return;
        }
        if (!resource.is_public_resource) {
            response_handler.set_failure_response(res, 404, 'This resource is not a public resource!');
            return;
        }
        var local_destination = await resource_service.download(resource);

        var filename = path.basename(local_destination);
        var mimetype = mime.getType(local_destination);
        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', mimetype);
        var filestream = fs.createReadStream(local_destination);
        filestream.pipe(res);

        //res.sendFile(local_destination);
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.download_by_reference = async (req, res) => {
    try {
        if (! await authorization_handler.check_role_authorization('resource.download_by_reference', req, res)) {
            return;
        }
        const reference_item_id = req.params.reference_item_id;
        const reference_item_keyword = req.query.reference_item_keyword ? req.query.reference_item_keyword : null;
        var o = await resource_service.download_by_reference(reference_item_id, reference_item_keyword);
        if (o.files == null || o.files.length == 0) {
            response_handler.set_failure_response(res, 404, 'No resources found for this reference id!');
            return;
        }
        var zipper = new admzip();
        for await (var f of o.files) {
            zipper.addLocalFile(f);
        }
        var zipFile = `${o.folderName}.zip`;
        const data = zipper.toBuffer();

        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename=${zipFile}`);
        res.set('Content-Length', data.length);
        res.send(data);

    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete = async (req, res) => {
    try {
        if (! await authorization_handler.check_role_authorization('resource.delete', req, res)) {
            return;
        }
        const resource_id = req.params.resource_id;
        await resource_service.delete(resource_id);
        response_handler.set_success_response(res, req, 200, 'Resource deleted successfully!', null);
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.delete_by_reference = async (req, res) => {
    try {
        if (! await authorization_handler.check_role_authorization('resource.delete_by_reference', req, res)) {
            return;
        }
        const reference_item_id = req.params.reference_item_id;
        const reference_item_keyword = req.query.reference_item_keyword ? req.query.reference_item_keyword : null;
        var resources = await resource_service.get_resources_by_reference(reference_item_id, reference_item_keyword);
        for await (var resource of resources) {
            await resource_service.delete(resource.id);
        }
        response_handler.set_success_response(res, req, 200, 'Resources deleted successfully!', null);
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.get_resources_by_reference = async (req, res) => {
    try {
        if (! await authorization_handler.check_role_authorization('resource.get_resources_by_reference', req, res)) {
            return;
        }
        const reference_item_id = req.params.reference_item_id;
        const reference_item_keyword = req.query.reference_item_keyword ? req.query.reference_item_keyword : null;
        var resources = await resource_service.get_resources_by_reference(reference_item_id, reference_item_keyword);
        response_handler.set_success_response(res, req, 200, 'Resources for reference item retrieved successfully!', { resources: resources });
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
};

exports.update_resource_reference = async (req, res) => {
    try {
        if (! await authorization_handler.check_role_authorization('resource.update_resource_reference', req, res)) {
            return;
        }
        if(!req.body.reference_item_id){
            throw new Error('Missing required parameters: req.body.reference_item_id is missing!');
        }
        const reference_item_id = req.body.reference_item_id;
        const reference_item_keyword = req.body.reference_item_keyword ? req.body.reference_item_keyword : null;
        await resource_service.update_resource_reference(req.params.resource_id, reference_item_id, reference_item_keyword);
        response_handler.set_success_response(res, req, 200, 'Resource reference updated successfully!', null);
    }
    catch (error) {
        response_handler.handle_error(error, res, req);
    }
}
