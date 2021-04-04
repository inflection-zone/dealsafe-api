
const Resource = require('../database/models/Resource').Model;
const Op = require('sequelize').Op;
const { ApiError } = require('../common/api_error');
const file_upload = require('express-fileupload');
const logger = require('../common/logger');
const aws = require('aws-sdk');
const fs = require('fs');
const helper = require('../common/helper');
const _ = require('lodash');
const path = require('path');
const moment = require('moment');

//////////////////////////////////////////////////////////////////////////////////////

const TEMP_UPLOAD_FOLDER = path.join(process.cwd(), './tmp/resources/uploads/');
const TEMP_DOWNLOAD_FOLDER = path.join(process.cwd(), './tmp/resources/downloads/');
const CLEANUP_INTERVAL_MIN = 10;

//////////////////////////////////////////////////////////////////////////////////////

module.exports.upload = async (user_id, files, is_public, reference_item_id, keyword) => {
    var uploaded = [];
    var timestamp = new Date().getTime().toString();
    var folder = path.join(TEMP_UPLOAD_FOLDER, timestamp);
    var details = await store_locally(folder, files);
    if (details.length > 0) {
        uploaded = await this.upload_to_cloud_storage(user_id, details, is_public, reference_item_id, keyword);
        return uploaded;
    }
    return [];
}

module.exports.download = async (resource) => {
    var timestamp = new Date().getTime().toString();
    var local_path = await this.download_from_cloud_storage(resource, timestamp);
    return local_path;
}

module.exports.get_resource_by_id = async (resourceId) => {
    return await Resource.findByPk(resourceId);
}

module.exports.get_resources_by_reference = async (reference_item_id, keyword = null) => {
    var selector = {
        reference_item_id: reference_item_id
    };
    if (keyword != null) {
        selector.reference_item_keyword = { [Op.like]: '%' + keyword + '%' };
    }
    var entities = await Resource.findAll({ where: selector });
    var resources = [];
    for await (var e of entities) {
        var r = get_object_to_send(e);
        resources.push(r);
    }
    return resources;
}

module.exports.download_by_reference = async (reference_item_id, keyword = null) => {
    var selector = {
        reference_item_id: reference_item_id
    };
    if (keyword != null) {
        selector.reference_item_keyword = { [Op.like]: '%' + keyword + '%' };
    }
    var resources = await Resource.findAll({ where: selector });
    var timestamp = new Date().getTime().toString();
    var files = [];
    for await (var r of resources) {
        var local_destination = await this.download_from_cloud_storage(r, timestamp);
        files.push(local_destination);
    }
    return {
        folder: timestamp,
        files: files,
        reference_item_id: reference_item_id,
        reference_item_keyword: keyword
    };
}

module.exports.delete = async (resource_id) => {
    try {
        var resource = await Resource.findByPk(resource_id);
        if (resource == null) {
            return false;
        }
        await this.delete_from_cloud_storage(resource);
        var result = await Resource.destroy({
            where: {
                id: resource_id
            }
        });
        return true;
    }
    catch (error) {
        throw error;
    }
}

///////////////////////////////////////////////////////////////////////////

module.exports.download_from_cloud_storage = async (resource, folder) => {
    const s3 = new aws.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET
    });

    var s3_path = resource.cloud_storage_key;
    const params = {
        Bucket: process.env.RESOURCES_S3_BUCKET_NAME,
        Key: s3_path
    };
    var tokens = s3_path.split('/');
    var local_file = tokens[tokens.length - 1];

    var folder = path.join(TEMP_DOWNLOAD_FOLDER, folder);
    await fs.promises.mkdir(folder, { recursive: true })
    var local_destination = path.join(folder, local_file);

    var file = fs.createWriteStream(local_destination);

    return new Promise((resolve, reject) => {
        s3.getObject(params).createReadStream()
            .on('end', () => {
                var st = fs.existsSync(local_destination);
                var stats = fs.statSync(local_destination);
                var count = 0;
                while (stats.size == 0 && count < 5) {
                    setTimeout(() => {
                        stats = fs.statSync(local_destination);
                    }, 3000);
                    count++;
                }
                return resolve(local_destination);
            })
            .on('error', (error) => {
                return reject(error);
            }).pipe(file);
    });
}

module.exports.upload_to_cloud_storage = async (user_id, details, is_public, reference_item_id, keyword = null) => {

    try {
        const s3 = new aws.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
        });

        var uploaded = [];

        for await (var d of details) {

            var filename = d.name;
            var filepath = d.path;
            var date_folder = new Date().toISOString().split('T')[0]
            const file_content = fs.readFileSync(filepath);
            var s3_path = 'resources/' + date_folder + '/' + filename;

            const params = {
                Bucket: process.env.RESOURCES_S3_BUCKET_NAME,
                Key: s3_path,
                Body: file_content
            };

            var stored = await s3.upload(params).promise();

            var loc = await Resource.create({
                added_by: user_id,
                cloud_storage_key: s3_path,
                is_public_resource: is_public,
                mime_type: d.mime_type,
                reference_item_id: reference_item_id,
                reference_item_keyword: keyword
            })

            if (is_public) {
                uploaded.push({
                    file_name: d.original_name,
                    resource_id: loc.id,
                    url_with_auth: process.env.THIS_BASE_URL + '/api/v1/resources/download/' + loc.id,
                    url_public: process.env.THIS_BASE_URL + '/api/v1/resources/download-public/' + loc.id,
                    mime_type: d.mime_type,
                    size: d.size
                });
            }
            else {
                uploaded.push({
                    file_name: d.original_name,
                    resource_id: loc.id,
                    url_with_auth: process.env.THIS_BASE_URL + '/api/v1/resources/download/' + loc.id,
                    url_public: null,
                    mime_type: d.mime_type,
                    size: d.size
                });
            }

            console.log(`File uploaded successfully. ${stored.Location}`);
        }
        return uploaded;

    }
    catch (error) {
        throw(error);
    }
}

module.exports.delete_from_cloud_storage = async (resource) => {
    const s3 = new aws.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET
    });
    const params = {
        Bucket: process.env.RESOURCES_S3_BUCKET_NAME,
        Key: resource.cloud_storage_key
    };
    await s3.deleteObject(params).promise();
}

module.exports.update_resource_reference = async (resource_id, reference_item_id, reference_item_keyword) => {
    try {
        var resource = await Resource.findByPk(resource_id);
        if (resource == null) {
            throw new Error('Resource with id ' + resource_id + ' cannot be found!');
        }
        resource.reference_item_id = reference_item_id;
        resource.reference_item_keyword = reference_item_keyword;
        await resource.save();
    }
    catch (error) {
        throw(error);
    }
}
//////////////////////////////////////////////////////////////////////////

function get_object_to_send(entity) {
    if (entity == null) {
        return null;
    }
    return {
        id: entity.id,
        added_by: entity.added_by,
        mime_type: entity.mime_type,
        reference_item_id: entity.reference_item_id,
        reference_item_keyword: entity.reference_item_keyword,
        created_at: entity.created_at,
        updated_at: entity.updated_at
    };
}

async function move_to_temp_folder(folder, m, details) {

    var timestamp = new Date().getTime().toString();
    var filename = m.name;
    var ext = helper.get_file_extension(filename);

    filename = filename.replace('.' + ext, "");
    filename = filename.replace(' ', "_");
    filename = filename + '_' + timestamp + '.' + ext;
    var temp_file_name = path.join(folder, filename);

    var move_file = async (m, temp_file_name) => {

        return new Promise((resolve, reject) => {
            m.mv(temp_file_name, function (error) {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    }

    await move_file(m, temp_file_name);

    //push file details
    details.push({
        name: filename,
        path: temp_file_name,
        mime_type: m.mime_type,
        original_name: m.name,
        size: m.size
    });
}

async function store_locally(temp_folder, files) {

    var file_details = [];

    var keys = _.keysIn(files);
    for await (var key of keys) {
        let f = files[key];
        if (Array.isArray(f)) {
            for await (var m of f) {
                await move_to_temp_folder(temp_folder, m, file_details);
            }
        }
        else {
            await move_to_temp_folder(temp_folder, f, file_details);
        }
    }
    return file_details;
}

///////////////////////////////////////////////////////////////////////

// Code to clean-up old files from temp folder

module.exports.cleanup = async () => {
    await cleanup_folders(TEMP_UPLOAD_FOLDER);
    await cleanup_folders(TEMP_DOWNLOAD_FOLDER);
}

async function cleanup_folders(parent_folder) {
    try {
        const get_folders = source =>
            fs.readdirSync(source, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

        var dt = moment(new Date()).subtract(CLEANUP_INTERVAL_MIN, 'minutes');
        var directories = get_folders(parent_folder);
        for await (var d of directories) {
            var tmp = new Date();
            tmp.setTime(d);
            var created_at = moment(tmp);
            if (created_at.isBefore(dt)) {
                var dPath = path.join(parent_folder, d);
                fs.rmdirSync(dPath, { recursive: true });
            }
        }
    }
    catch (error) {
        logger.log(error.message);
    }
}

// function move_to_temp_folder(folder, m, details) {

//     var timestamp = new Date().getTime().toString();
//     var filename = m.name;
//     var ext = helper.get_file_extension(filename);

//     filename = filename.replace('.' + ext, "");
//     filename = filename.replace(' ', "_");
//     filename = filename + '_' + timestamp + '.' + ext;
//     var temp_file_name = path.join(folder, filename);

//     var move_file = async (m, temp_file_name) => {

//         return new Promise((resolve, reject) => {
//             m.mv(temp_file_name, function (error) {
//                 if (error) {
//                     return reject(error);
//                 }
//                 return resolve();
//             });
//         });
//     }

//     (async () => {
//         await move_file(m, temp_file_name);
//     })();

//     //push file details
//     details.push({
//         name: filename,
//         path: temp_file_name,
//         mime_type: m.mime_type,
//         original_name: m.name,
//         size: m.size
//     });
// }
