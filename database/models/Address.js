const db = require(__dirname + '/../connection');

const Sequelize = db.Sequelize;
const sequelize = db.sequelize;

////////////////////////////////////////////////////////////////////////

const schema = {

    id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
    },
    company_id: {
        type: Sequelize.UUID,
        allowNull: false,
    },
    address: {
        type: Sequelize.STRING(256),
        allowNull: false
    },
    city: {
        type: Sequelize.STRING(32),
        allowNull: false
    },
    state: {
        type: Sequelize.STRING(32),
        allowNull: true
    },
    country: {
        type: Sequelize.STRING(32),
        allowNull: true
    },
    pincode: {
        type: Sequelize.STRING(32),
        allowNull: true
    },
    is_company_address: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },


    is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
    },

    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE
};

var tableName = 'addresses';
var modelName = 'Address';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;