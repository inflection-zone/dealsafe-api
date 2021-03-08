"use strict"

const UserRole = require("../database/models/UserRole").Model;
const Privilege = require("../database/models/Privilege").Model;
const Role = require("../database/models/Role").Model;
const RolePrivilege = require("../database/models/RolePrivilege").Model;

const error_handler = require('../common/error_handler');

module.exports.get_roles_for_user = async (user_id) => {
    var roles = [];
    var user_roles = await UserRole.findAll({where: {user_id: user_id}});
    for await (var r of user_roles){
        var role = await Role.findByPk(r.role_id);
        roles.push(role);
    }
    return roles;
}

module.exports.add_role_to_user = async (user_id, role_id) =>{
    try {
        var entity = {
            user_id: user_id,
            role_id: role_id
        }
        var record = await UserRole.create(entity);
        return record; 
    }
    catch (error) {
        var msg = 'Problem encountered while adding role to the user!';
        error_handler.throw_service_error(error, msg);
    };
};

module.exports.get_privilege_by_name = async (privilege_name) => {
    return await Privilege.findOne({
        where: {
            name: privilege_name
        }
    });
}

module.exports.get_role_privileges_for_role = async (role_id) => {
    try {
        let objects = [];
        var records = await RolePrivilege.findAll({
            where: {
              is_active : true,
              role_id : role_id
            }});
        for (var record of records) {
            objects.push(record);
        }
        return objects;
    }
    catch (error) {
        console.log(error,"error");
        var msg = 'Problem encountered while retrieving role privilege instances!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.get_role_by_name = async (role_name) => {
    try {
        var search = { where: { name: role_name } };
        return await Role.findOne(search);
    }
    catch (error) {
        var msg = 'Problem encountered while retrieving role by name!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.get_privilege_by_id = async (privilege_id) => {
    try {
        return await Privilege.findOne({ 
            where: {
             is_active: true,
             id : privilege_id
            }
        });
    }
    catch (error) {
        var msg = 'Problem encountered while retrieving privilege!';
        error_handler.throw_service_error(error, msg);
    }
}
