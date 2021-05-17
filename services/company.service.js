'use strict';
const db = require('../database/connection');
const Company = require('../database/models/Company').Model;
const Address = require('../database/models/Address').Model;
const User = require('../database/models/User').Model;
const helper = require('../common/helper');
const { ApiError } = require('../common/api_error');
const logger = require('../common/logger');
const _ = require('lodash');
const Op = require('sequelize').Op;

//////////////////////////////////////////////////////////////////////////////////////

module.exports.create = async (req) => {
    try {
        var contact_person = null;
        var request_body = req.body;
        if (req.user.user_id) {
            contact_person = await User.findByPk(req.user.user_id);
            if (contact_person == null) {
                throw new ApiError('Contact person not found!', 404);
            }
        }
        request_body.contact_person_id = req.user.user_id;
        var entity = get_entity_to_save(request_body)
        var record = await Company.create(entity);
        if (contact_person != null) {
            contact_person.company_id = record.id;
            await contact_person.save();
        }
        return get_object_to_send(record);
    } catch (error) {
        throw (error);
    }
}

module.exports.search = async (filter) => {
    try {
        let objects = [];
        var search = {
            where: {
                is_active: true
            }
        };

        if (filter.hasOwnProperty('name')) {
            search.where.name = { [Op.iLike]: '%' + filter.name + '%' };
        }

        if (filter.hasOwnProperty('contact_email')) {
            search.where.name = filter.contact_email;
        }

        if (filter.hasOwnProperty('contact_number')) {
            search.where.contact_number = filter.contact_number;
        }

        if (filter.hasOwnProperty('GSTN')) {
            search.where.GSTN = filter.GSTN;
        }

        if (filter.hasOwnProperty('PAN')) {
            search.where.PAN = filter.PAN;
        }

        if (filter.hasOwnProperty('TAN')) {
            search.where.TAN = filter.TAN;
        }

        if (filter.hasOwnProperty('subscription_type')) {
            search.where.subscription_type = filter.subscription_type;
        }

        if (filter.hasOwnProperty('contact_person_id')) {
            search.where.contact_person_id = filter.contact_person_id;
        }


        var records = await Company.findAll(search);
        for (var record of records) {
            objects.push(get_object_to_send(record));
        }

        sort_companies(filter, objects);
        paginate_companies(filter, objects);

        return objects;
    } catch (error) {
        throw (error);
    }
}

module.exports.get_company_by_contact_person_id = async (contact_id) => {
    try {
        var search = {
            where: {
                contact_person_id: contact_id,
                is_active: true
            }
        };
        var record = await Company.findOne(search);
        if (record == null) {
            return null;
        }
        return get_object_to_send(record);
    } catch (error) {
        throw (error);
    }
}

module.exports.get_by_id = async (id) => {
    try {
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await Company.findOne(search);
        if (record == null) {
            return null;
        }
        return get_object_to_send(record);
    } catch (error) {
        throw (error);
    }
}

module.exports.update = async (id, request_body) => {

    try {
        let updates = get_updates(request_body);
        var res = await Company.update(updates, {
            where: {
                id: id
            }
        });
        if (res.length != 1) {
            throw new ApiError('Unable to update company!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await Company.findOne(search);
        if (record == null) {
            return null;
        }

        return get_object_to_send(record);
    } catch (error) {
        var msg = 'Problem encountered while updating company!';
        throw (error);
    }
}

module.exports.delete = async (id) => {
    try {
        var res = await Company.update({
            is_active: false
        }, {
            where: {
                id: id
            }
        });
        return res.length == 1;
    } catch (error) {
        var msg = 'Problem encountered while deleting company!';
        throw (error);
    }
}

module.exports.get_deleted = async () => {
    try {
        var records = await Company.findAll({
            where: {
                is_active: false
            }
        });
        for (var record of records) {
            objects.push(get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        var msg = 'Problem encountered while deleted instances of company!';
        throw (error);
    }
}

module.exports.exists = async (id) => {
    try {
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await Company.findOne(search);
        if (record == null) {
            return null;
        }

        return record != null;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of company with id ' + id.toString() + '!';
        throw (error);
    }
}

module.exports.get_company_id_by_contact_person_id = async (user_id) => {
    try {

        var record = await Company.findAll({
            where: {
                is_active: true,
                contact_person_id: user_id
            },
            // Add order conditions here....
            order: [
                ['created_at', 'DESC'],
            ],
            attributes: ['id']
        });
        if (record == null) {
            return null;
        }
        return record[0].id;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of company!';
        throw (error);
    }
}

module.exports.company_exists_with = async (phone, email, gstn = null, pan = null, tan, name = null) => {
    try {
        var search = {
            where: {
                is_active: true
            }
        };
        if (phone) {
            search.where.contact_number = { [Op.iLike]: '%' + phone + '%' };
        }
        if (email) {
            search.where.contact_email = { [Op.iLike]: '%' + email + '%' };
        }
        if (gstn) {
            search.where.GSTN = { [Op.iLike]: '%' + gstn + '%' };
        }
        if (pan) {
            search.where.PAN = { [Op.iLike]: '%' + pan + '%' };
        }
        if (tan) {
            search.where.TAN = { [Op.iLike]: '%' + tan + '%' };
        }
        //console.log(search);
        var records = await Company.findAll(search);
        //console.log(records);
        return records.length > 0;
    } catch (error) {
        var msg = 'Problem encountered while checking existance of company!';
        throw (error);
    }
}

function get_entity_to_save(request_body) {
    return {
        display_id: helper.generate_display_id(),
        name: request_body.name ? request_body.name : null,
        description: request_body.description ? request_body.description : null,
        default_address_id: request_body.default_address_id ? request_body.default_address_id : null,
        contact_email: request_body.contact_email ? request_body.contact_email : null,
        contact_number: request_body.contact_number ? request_body.contact_number : null,
        GSTN: request_body.GSTN ? request_body.GSTN : null,
        PAN: request_body.PAN ? request_body.PAN : null,
        TAN: request_body.TAN ? request_body.TAN : null,
        contact_person_id: request_body.contact_person_id ? request_body.contact_person_id : null,
        subscription_type: request_body.subscription_type ? request_body.subscription_type : 'Regular'
    };
}

function get_updates(request_body) {
    let updates = {};
    if (request_body.hasOwnProperty('display_id')) {
        updates.display_id = request_body.display_id;
    }
    if (request_body.hasOwnProperty('name')) {
        updates.name = request_body.name;
    }
    if (request_body.hasOwnProperty('description')) {
        updates.description = request_body.description;
    }
    if (request_body.hasOwnProperty('default_address_id')) {
        updates.default_address_id = request_body.default_address_id;
    }
    if (request_body.hasOwnProperty('contact_email')) {
        updates.contact_email = request_body.contact_email;
    }
    if (request_body.hasOwnProperty('contact_number')) {
        updates.contact_number = request_body.contact_number;
    }
    if (request_body.hasOwnProperty('GSTN')) {
        updates.GSTN = request_body.GSTN;
    }
    if (request_body.hasOwnProperty('PAN')) {
        updates.PAN = request_body.PAN;
    }
    if (request_body.hasOwnProperty('TAN')) {
        updates.TAN = request_body.TAN;
    }
    if (request_body.hasOwnProperty('contact_person_id')) {
        updates.contact_person_id = request_body.contact_person_id;
    }
    if (request_body.hasOwnProperty('subscription_type')) {
        updates.subscription_type = request_body.subscription_type;
    }
    return updates;
}

async function get_object_to_send(record) {
    if (record == null) {
        return null;
    }
    var address = await Address.findByPk(record.default_address_id);
    var contact_person = {};
    if (record.contact_person_id) {
        var user = await User.findByPk(record.contact_person_id);
        if (user != null) {
            contact_person['display_id'] = user.display_id;
            contact_person['first_name'] = user.first_name;
            contact_person['last_name'] = user.last_name;
            contact_person['prefix'] = user.prefix;
            contact_person['phone'] = user.phone;
            contact_person['email'] = user.email;
            contact_person['last_name'] = user.last_name;
            contact_person['gender'] = user.gender;
            contact_person['profile_picture'] = user.profile_picture;
        }
    }
    return {
        id: record.id,
        display_id: record.display_id,
        name: record.name,
        description: record.description,
        default_address_id: record.default_address_id,
        default_address: address,
        contact_email: record.contact_email,
        contact_number: record.contact_number,
        GSTN: record.GSTN,
        PAN: record.PAN,
        TAN: record.TAN,
        contact_person_id: record.contact_person_id,
        contact_person: contact_person,
        subscription_type: record.subscription_type
    };
}

function sort_companies(filter, array) {

    //default sorting by date - recent first
    array.sort((a, b) => { return new Date(b.created_at) - new Date(a.created_at) });

    if (!filter.hasOwnProperty('sort_by')) {
        return array;
    }

    if (filter.sort_by == "created_at") {
        if (filter.sort_type == "ascending") {
            array.sort((a, b) => { return new Date(a.created_at) - new Date(b.created_at) });
        }
        else {
            array.sort((a, b) => { return new Date(b.created_at) - new Date(alert.created_at) });
        }
    }

    if (filter.sort_by == "name") {
        array.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        });
        if (filter.sort_type != "ascending") {
            array.reverse();
        }
    }

    if (filter.sort_by == "contact_email") {
        array.sort((a, b) => {
            if (a.contact_email < b.contact_email) {
                return -1;
            }
            if (a.contact_email > b.contact_email) {
                return 1;
            }
            return 0;
        });
        if (filter.sort_type != "ascending") {
            array.reverse();
        }
    }

    if (filter.sort_by == "contact_number") {
        array.sort((a, b) => {
            if (a.contact_number < b.contact_number) {
                return -1;
            }
            if (a.contact_number > b.contact_number) {
                return 1;
            }
            return 0;
        });
        if (filter.sort_type != "ascending") {
            array.reverse();
        }
    }

    if (filter.sort_by == "GSTN") {
        array.sort((a, b) => {
            if (a.GSTN < b.GSTN) {
                return -1;
            }
            if (a.GSTN > b.GSTN) {
                return 1;
            }
            return 0;
        });
        if (filter.sort_type != "ascending") {
            array.reverse();
        }
    }

    if (filter.sort_by == "PAN") {
        array.sort((a, b) => {
            if (a.PAN < b.PAN) {
                return -1;
            }
            if (a.PAN > b.PAN) {
                return 1;
            }
            return 0;
        });
        if (filter.sort_type != "ascending") {
            array.reverse();
        }
    }

    if (filter.sort_by == "TAN") {
        array.sort((a, b) => {
            if (a.TAN < b.TAN) {
                return -1;
            }
            if (a.TAN > b.TAN) {
                return 1;
            }
            return 0;
        });
        if (filter.sort_type != "ascending") {
            array.reverse();
        }
    }

    if (filter.sort_by == "subscription_type") {
        array.sort((a, b) => {
            if (a.subscription_type < b.subscription_type) {
                return -1;
            }
            if (a.subscription_type > b.subscription_type) {
                return 1;
            }
            return 0;
        });
        if (filter.sort_type != "ascending") {
            array.reverse();
        }
    }

}

function paginate_companies(filter, array) {
    if (filter.hasOwnProperty("page_number") && filter.hasOwnProperty("items_per_page")) {
        var start_offset = (filter.page_number - 1) * filter.items_per_page;
        var end_offset = filter.page_number * filter.items_per_page;
        var current_page = filter.page_number ? +filter.page_number : 1;
        var total_pages = Math.ceil(array.length / parseInt(filter.items_per_page));
        array = array.slice(start_offset, end_offset);
    }
    return {
        current_page: current_page,
        total_pages: total_pages,
        items_per_page: filter.items_per_page,
        companies: array
    };
}
