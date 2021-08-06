'use strict';

const db = require('../database/connection');
const Role = require('../database/models/Role').Model;
const CityPincode = require('../database/models/CityPincode').Model;
const helper = require('../common/helper');
const { ApiError } = require('../common/api_error');
const logger = require('../common/logger');
const Op = require('sequelize').Op;
const Constants = require('../common/Constants');

//////////////////////////////////////////////////////////////////////////////////////

module.exports.get_user_roles = async () => {
    try {
        return await Role.findAll();
    }
    catch (error) {
        throw(error);
    }
}

module.exports.get_contract_roles = () => {
    return new Promise((resolve, reject) => {
        try {
            resolve(Constants.ContractRoles);
        }
        catch (error) {
            reject(error);
        }
    });
}

module.exports.get_bank_account_types = () => {
    return new Promise((resolve, reject) => {
        try {
            resolve(Constants.BankAccountTypes);
        }
        catch (error) {
            reject(error);
        }
    });
}

module.exports.get_contract_payment_modes = () => {
    return new Promise((resolve, reject) => {
        try {
            resolve(Constants.ContractPaymentModes);
        }
        catch (error) {
            reject(error);
        }
    });
}

module.exports.get_contract_status_types = () => {
    return new Promise((resolve, reject) => {
        try {
            resolve(Constants.ContractStatusTypes);
        }
        catch (error) {
            reject(error);
        }
    });
}

module.exports.get_transaction_types = () => {
    return new Promise((resolve, reject) => {
        try {
            resolve(Constants.TransactionTypes);
        }
        catch (error) {
            reject(error);
        }
    });
}

module.exports.get_transaction_status_types = () => {
    return new Promise((resolve, reject) => {
        try {
            resolve(Constants.TransactionStatusTypes);
        }
        catch (error) {
            reject(error);
        }
    });
}

//////////////////////////////////////////////////////////////////////////////////////

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
        throw(error);
    }
}

module.exports.get_pincode_by_city = async (city_name) => {
    try {
        var entities = await CityPincode.findAll({
            where:{
                city: {
                    [Op.like]:'%' + city_name + '%'
                }
            }
        });
        return entities;
    }
    catch (error) {
        throw(error);
    }
}

module.exports.get_cities_by_state = async (state) => {
    try {
        var entities = await CityPincode.findAll({
            where:{
                state: {
                    [Op.like]:'%' + state + '%'
                }
            }
        });
        var cities = entities.map(x => x.city);
        var unique_cities = [...new Set(cities)];
        unique_cities.sort();
        return unique_cities;
    }
    catch (error) {
        throw(error);
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
