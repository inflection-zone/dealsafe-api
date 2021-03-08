'use strict';

const db = require('../database/connection');
const Role = require('../database/models/Role').Model;
const CityPincode = require('../database/models/CityPincode').Model;
const helper = require('../common/helper');
const error_handler = require('../common/error_handler');
const authorization_handler = require('../common/authorization_handler');
const logger = require('../common/logger');
const Op = require('sequelize').Op;

module.exports.get_role_types = async () => {
    try {
        return await Role.findAll();
    }
    catch (error) {
        var msg = 'Problem encountered while retrieving role types!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.get_city_by_pincode = async (pincode) => {
    try {
        var entity = await CityPincode.findOne({
            where: {
                pincode: pincode
            }
        });
        return entity;
    }
    catch (error) {
        var msg = 'Problem encountered while retrieving city for the pincode!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.get_pincode_by_city = async (city_name) => {
    try {
        var entities = await CityPincode.findAll({
            where:{
                city: {
                    [Op.iLike]:'%' + city_name + '%'
                }
            }
        });
        return entities;
    }
    catch (error) {
        var msg = 'Problem encountered while retrieving pincodes for the city!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.get_cities_by_state = async (state) => {
    try {
        var entities = await CityPincode.findAll({
            where:{
                state: {
                    [Op.iLike]:'%' + state + '%'
                }
            }
        });
        var cities = entities.map(x => x.city);
        var unique_cities = [...new Set(cities)];
        unique_cities.sort();
        return unique_cities;
    }
    catch (error) {
        var msg = 'Problem encountered while retrieving cities by the state!';
        error_handler.throw_service_error(error, msg);
    }
}

module.exports.get_states = async () => {
    return new Promise((resolve, reject) => {
        try {
            var entities = [
                "Andaman Nicobar",
                "Andhra Pradesh",
                "Arunachal Pradesh",
                "Assam",
                "Bihar",
                "Chandigarh",
                "Chhattisgarh",
                "Dadra & Nagar Haveli",
                "Daman & Diu",
                "Delhi",
                "Goa",
                "Gujarat",
                "Haryana",
                "Himachal Pradesh",
                "Jammu & Kashmir",
                "Jharkhand",
                "Karnataka",
                "Kerala",
                "Lakshdweep",
                "Madhya Pradesh",
                "Maharashtra",
                "Manipur",
                "Meghalaya",
                "Mizoram",
                "Nagaland",
                "Orissa",
                "Pondicherry",
                "Punjab",
                "Rajasthan",
                "Sikkim",
                "Tamil Nadu",
                "Tripura",
                "Uttar Pradesh",
                "Uttaranchal",
                "West Bengal"
            ];
            resolve(entities);
        }
        catch (error) {
            reject(error);
        }
    });

}
