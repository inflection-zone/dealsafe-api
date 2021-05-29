'use strict';

const db = require('../database/connection');
const User = require('../database/models/User').Model;
const UserRole = require('../database/models/UserRole').Model;
const Role = require('../database/models/Role').Model;
const helper = require('../common/helper');
const authorization_handler = require('../common/authorization_handler');
const { ApiError } = require('../common/api_error');
const logger = require('../common/logger');
const { DateTime } = require('luxon');
const Op = require('sequelize').Op;
const bcryptjs = require('bcryptjs');
const Roles = require('../common/constants').Roles;

const messaging_service = require('../thirdparty/message.service');

//////////////////////////////////////////////////////////////////////////////////////

module.exports.create = async (request_body, roles) => {
    try {
        var entity = await get_entity_to_save(request_body)
        var record = await User.create(entity);
        var user_roles = [];
        if (roles && roles.length > 0) {
            user_roles = await add_user_roles(record.id, roles);
        }
        return get_object_to_send(record, await get_user_roles(record.id));
    } catch (error) {
        throw(error);
    }
}

module.exports.search = async (filter) => {
    try {
        var objects = [];
        var search = { where: { is_active: true } };
        if (filter.hasOwnProperty('name')) {
            search = {
                where: {
                    is_active: true,
                    [Op.or]: [
                        { first_name: { [Op.iLike]: '%' + filter.name + '%' } },
                        { last_name: { [Op.iLike]: '%' + filter.name + '%' } }
                    ]
                }
            };
        }
        if (filter.hasOwnProperty("role_id")) {
            var user_roles = await UserRole.findAll({ where: { is_active: true, role_id: filter.role_id } });
            var user_ids = user_roles.map(x => x.user_id);
            search.where.id = { [Op.or]: user_ids };
        }
        if (filter.hasOwnProperty('company_id')) {
            search.where['company_id'] = filter.company_id;
        }
        if (filter.hasOwnProperty('phone')) {
            search.where['phone'] = { [Op.iLike]: '%' + filter.phone + '%' };
        }
        if (filter.hasOwnProperty('email')) {
            search.where['email'] = { [Op.iLike]: '%' + filter.email + '%' };
        }
        var records = await User.findAll(search);
        if (filter.hasOwnProperty("role")) {
            //If already filtered by role
            objects = records.map(x => { return get_object_to_send(x); });
        }
        else {
            for await (var record of records) {
                var roles = await get_user_roles(record.id);
                var obj = get_object_to_send(record, roles);
                objects.push(obj);
            }
        }
        return objects;
    } catch (error) {
        throw(error);
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
        var record = await User.findOne(search);
        if (record == null) {
            return null;
        }
        var roles = await get_user_roles(record.id);
        return get_object_to_send(record, roles);
    } catch (error) {
        throw(error);
    }
}

module.exports.get_by_display_id = async (display_id) => {
    try {
        var search = {
            where: {
                display_id: display_id,
                is_active: true
            }
        };
        var record = await User.findOne(search);
        if (record == null) {
            return null;
        }
        var roles = await get_user_roles(record.id);
        return get_object_to_send(record, roles);
    }
    catch (error) {
        throw(error);
    }
}

module.exports.update = async (id, request_body) => {
    try {
        await check_other_user_with_same_phone(id, request_body);
        let updates = get_updates(request_body);
        var res = await User.update(updates, {
            where: {
                id: id,
            }
        });
        if (res.length != 1) {
            throw new ApiError('Unable to update user!');
        }
        var search = {
            where: {
                id: id,
                is_active: true
            }
        };
        var record = await User.findOne(search);
        if (record == null) {
            return null;
        }

        var record = await User.findOne({ where: { id: id, is_active: true } });
        var roles = await get_user_roles(record.id);
        return get_object_to_send(record, roles);

    } catch (error) {
        throw(error);
    }
}

module.exports.delete = async (id) => {
    try {
        var res = await User.update({
            is_active: false
        }, {
            where: {
                id: id
            }
        });
        return res.length == 1;
    } catch (error) {
        throw(error);
    }
}
module.exports.get_deleted = async () => {
    try {
        var records = await User.findAll({
            where: {
                is_active: false
            }
        });
        for (var record of records) {
            objects.push(get_object_to_send(record))
        }
        return objects;
    } catch (error) {
        throw(error);
    }
}

module.exports.phone_exists = async (phone) => {
    try {
        var search = {
            where: {
                phone: phone,
                is_active: true
            }
        };
        var record = await User.findOne(search);
        return record != null;
    }
    catch (error) {
        throw(error);
    }
}

module.exports.email_exists = async (email) => {
    try {
        var search = {
            where: {
                email: email,
                is_active: true
            }
        };
        var record = await User.findOne(search);
        return record != null;
    }
    catch (error) {
        throw(error);
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
        var record = await User.findOne(search);
        if (record == null) {
            return null;
        }
        return record != null;
    } catch (error) {
        throw(error);
    }
}

module.exports.generate_otp = async (phone, user_name, user_id) => {
    try {
        var user = get_user(user_id, user_name, phone, null);
        var otp = (Math.floor(Math.random() * 900000) + 100000).toString();
        var valid_to = DateTime.fromJSDate(Date.now()).plus({ seconds: 180 });

        var entity = await Otp.create({
            user_name: user.user_name,
            user_id: user.id,
            phone: user.phone,
            OTP: otp,
            valid_from: Date.now(),
            valid_to: valid_to
        });
        var platform_phone_number = '+91 1234567890';
        var otp_message = `Hello ${user.first_name}, ${otp} is login OTP for login on Deal-Safe platform. If you have not requested this OTP, please contact Deal-Safe support.`;
        await messaging_service.send_message_sms(user.phone, otp_message, platform_phone_number);
        return entity;
    }
    catch (error) {
        throw(error);
    }
}

module.exports.login_with_otp = async (phone, user_name, user_id, otp) => {
    try {
        var user = await get_user(user_id, user_name, phone, null);
        var otp_entity = await Otp.findOne({
            where: {
                phone: user.phone,
                user_id: user.id,
                user_name: user.user_name,
                OTP: otp
            }
        });
        if (!otp_entity) {
            throw new ApiError("OTP record not found for the user!", 404);
        }
        var date = new Date();
        if ((otp_entity.valid_from >= date || otp_entity.valid_to <= date)) {
            throw new Error('Login OTP has expired. Please regenerate OTP again!', 401);
        }
        var obj = {
            user_id: user.id,
            user_name: user.user_name,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            email: user.email,
            enterprise_type_id: user.enterprise_type_id,
            enterprise_id: user.enterprise_id
        };
        var access_token = authorization_handler.generate_token(obj);
        var roles = await UserRole.findAll({ where: { user_id: user.id, is_active: true } });
        var entity = get_object_to_send(user, null, roles);
        var obj = {
            user: entity,
            access_token: access_token,
            first_login_update_password: user.last_login == null,
            last_logged_in_on: user.last_login
        };
        user.last_login = Date.now();
        await user.save();
        return obj;
    }
    catch (error) {
        throw(error);
    }
}

module.exports.login = async (phone, email, user_name, password) => {
    try {
        var user = await get_user(null, user_name, phone, email);
        var is_password_valid = await bcryptjs.compareSync(password, user.password);
        if (!is_password_valid) {
            throw new Error('Incorrect password!');
        }
        //The following user data is immutable. Don't include any mutable data
        var obj = {
            user_id: user.id,
            user_name: user.user_name,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            email: user.email,
            enterprise_type_id: user.enterprise_type_id,
            enterprise_id: user.enterprise_id
        };
        var access_token = authorization_handler.generate_token(obj);
        var roles = await UserRole.findAll({ where: { user_id: user.id } });
        var entity = get_object_to_send(user, null, roles);
        var obj = {
            user: entity,
            access_token: access_token,
            first_login_update_password: user.last_login == null,
            last_logged_in_on: user.last_login
        };
        user.last_login = Date.now();
        await user.save();
        return obj;
    }
    catch (error) {
        throw(error);
    }
}

module.exports.change_password = async (user_id, previous_password, new_password) => {
    try {
        if (new_password == null) {
            throw new Error('New password is not specified!');
        }
        var validated = validate_password(new_password);
        if (!validated) {
            throw new ApiError('New password does not fit the security criteria. \
                The new password must be between 7 to 15 character long, \
                should have atleast 1 digit, 1 special character, \
                1 lower-case and 1 uppercase letter.', 406);
        }
        let user = await User.findOne({ where: { id: user_id, is_active: true } });
        if (user == null) {
            throw new ApiError('User does not exist!', 404);
        }
        if (previous_password != null) {
            var is_previous_password_valid = await bcryptjs.compareSync(previous_password, user.password);
            if (!is_previous_password_valid) {
                throw new ApiError('Invalid previous password!', 401);
            }
        }
        var same_password_specified = await bcryptjs.compareSync(new_password, user.password);
        if (same_password_specified) {
            throw new ApiError('New password is same as old password!', 406);
        }
        var new_encrypted_password = bcryptjs.hashSync(new_password, bcryptjs.genSaltSync(8), null);
        user.password = new_encrypted_password;
        await user.save();
    }
    catch (error) {
        throw(error);
    }
};

async function get_entity_to_save(request_body) {

    var user_name = await generate_user_name(request_body.first_name, request_body.last_name);

    return {
        display_id: helper.generate_display_id(),
        first_name: request_body.first_name ? request_body.first_name : null,
        last_name: request_body.last_name ? request_body.last_name : null,
        prefix: request_body.prefix ? request_body.prefix : null,
        phone: helper.sanitize_phonenumber(request_body.phone) ? request_body.phone : null,
        email: request_body.email ? request_body.email : null,
        user_name: request_body.user_name ? request_body.user_name : user_name,
        password: request_body.password ? request_body.password : null,
        profile_picture: request_body.profile_picture ? request_body.profile_picture : null,
        gender: request_body.gender ? request_body.gender : null,
        birth_date: request_body.birth_date ? request_body.birth_date : null,
        company_id: request_body.company_id ? request_body.company_id : null,
        company_type: request_body.company_type ? request_body.company_type : null,
        is_contact_person_for_organization: request_body.is_contact_person_for_organization ? request_body.is_contact_person_for_organization : false,
        primary_address_id: request_body.primary_address_id ? request_body.primary_address_id : null,
        deleted_at: request_body.deleted_at ? request_body.deleted_at : null,
        last_login: request_body.last_login ? request_body.last_login : null
    };
}

function get_updates(request_body) {
    let updates = {};
    if (request_body.hasOwnProperty('display_id')) {
        updates.display_id = request_body.display_id;
    }
    if (request_body.hasOwnProperty('first_name')) {
        updates.first_name = request_body.first_name;
    }
    if (request_body.hasOwnProperty('last_name')) {
        updates.last_name = request_body.last_name;
    }
    if (request_body.hasOwnProperty('prefix')) {
        updates.prefix = request_body.prefix;
    }
    if (request_body.hasOwnProperty('phone')) {
        updates.phone = request_body.phone;
    }
    if (request_body.hasOwnProperty('email')) {
        updates.email = request_body.email;
    }
    if (request_body.hasOwnProperty('user_name')) {
        updates.user_name = request_body.user_name;
    }
    if (request_body.hasOwnProperty('password')) {
        updates.password = request_body.password;
    }
    if (request_body.hasOwnProperty('profile_picture')) {
        updates.profile_picture = request_body.profile_picture;
    }
    if (request_body.hasOwnProperty('gender')) {
        updates.gender = request_body.gender;
    }
    if (request_body.hasOwnProperty('birth_date')) {
        updates.birth_date = request_body.birth_date;
    }
    if (request_body.hasOwnProperty('company_id')) {
        updates.company_id = request_body.company_id;
    }
    if (request_body.hasOwnProperty('company_type')) {
        updates.company_type = request_body.company_type;
    }
    if (request_body.hasOwnProperty('is_contact_person_for_organization')) {
        updates.is_contact_person_for_organization = request_body.is_contact_person_for_organization;
    }
    if (request_body.hasOwnProperty('primary_address_id')) {
        updates.primary_address_id = request_body.primary_address_id;
    }
    if (request_body.hasOwnProperty('deleted_at')) {
        updates.deleted_at = request_body.deleted_at;
    }
    if (request_body.hasOwnProperty('last_login')) {
        updates.last_login = request_body.last_login;
    }
    return updates;
}

function get_object_to_send(record, roles = null) {
    if (record == null) {
        return null;
    }
    return {
        id: record.id,
        display_id: record.display_id,
        first_name: record.first_name,
        last_name: record.last_name,
        prefix: record.prefix,
        phone: record.phone,
        email: record.email,
        user_name: record.user_name,
        profile_picture: record.profile_picture,
        gender: record.gender,
        birth_date: record.birth_date,
        company_id: record.company_id,
        company_type: record.company_type,
        is_contact_person_for_organization: record.is_contact_person_for_organization,
        primary_address_id: record.primary_address_id,
        roles: roles,
        deleted_at: record.deleted_at,
        last_login: record.last_login
    };
}

async function check_other_user_with_same_phone(id, request_body) {
    if (request_body.phone) {
        var exists = await User.findOne({
            where: {
                phone: request_body.phone,
                is_active: true,
                [Op.not]: [{ id: id }]
            }
        });
        if (exists) {
            throw new ApiError("User with this phone already exists!", 406);
        };
    }
}

async function get_user_roles(user_id) {
    var roles = [];
    var user_roles = await UserRole.findAll({ where: { user_id: user_id } });
    for await (var r of user_roles) {
        var role = await Role.findByPk(r.role_id);
        if (role != null) {
            roles.push(role);
        }
    }
    return roles;
}

function validate_password(password) {
    var passw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{7,15}$/;
    if (password.value.match(passw)) {
        return true;
    }
    return false;
}

async function get_user(user_id, user_name, phone, email) {
    var user = null;
    if (phone != null) {
        user = await User.findOne({
            where: {
                is_active: true,
                [Op.or]: [
                    { phone: { [Op.like]: '%' + phone + '%' } }
                ]
            }
        });
    }
    else if (email != null) {
        user = await User.findOne({ where: { email: email } });
    }
    else if (user_id != null) {
        user = await User.findOne({ where: { id: user_id, is_active: true } });
    }
    else if (user_name != null) {
        user = await User.findOne({ where: { user_name: user_name, is_active: true } });
    }
    if (user == null) {
        var err_message = 'User does not exist';
        err_message += phone ? ' with Phone(' + phone.toString() + ')' : '';
        err_message += email ? ' - with Email(' + email + ')' : '';
        err_message += user_name ? ' - with username(' + user_name + ')' : '';
        err_message += user_id ? ' - with user id(' + user_id + ')' : '';

        throw new ApiError(err_message, 404);
    }
    return user;
}

async function generate_user_name(first, last) {
    var rand = Math.random().toString(10).substr(2, 5);
    var user_name = first.substr(0, 3) + last.substr(0, 3) + rand;
    user_name = user_name.toLowerCase();
    var users = await User.findAll({
        where: {
            user_name: { [Op.like]: '%' + user_name + '%' }
        }
    });
    while (users.length > 0) {
        rand = Math.random().toString(36).substr(2, 5);
        user_name = first.substr(0, 3) + last.substr(0, 2) + rand;
        user_name = user_name.toLowerCase();
        users = await User.findAll({
            where: {
                user_name: { [Op.like]: '%' + user_name + '%' }
            }
        });
    }
    return user_name;
}

async function get_roles(role_names) {
    var roles = [];
    for await (var role_name of role_names) {
        var role = await Role.findOne({
            where:
            {
                name: {
                    [Op.like]: '%' + role_name + '%'
                }
            }
        });
        if (role) {
            roles.push(role);
        }
    }
    return roles;
}

async function add_user_roles(user_id, role_names) {
    var roles = await get_roles(role_names);
    var user_roles = [];
    for await (var role of roles) {
        var user_role = await UserRole.create({
            user_id: user_id,
            role_id: role.id
        });
        user_roles.push(user_role);
    }
    return user_roles;
}
