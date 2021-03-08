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
        allowNull: true
    },
    user_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    is_company_account: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    account_number: {
        type: Sequelize.STRING(64),
        allowNull: false
    },
    account_name: {
        type: Sequelize.STRING(128),
        allowNull: false
    },
    account_type: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    bank_name: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    bank_branch: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    bank_ifsc_code: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    PAN: {
        type: Sequelize.STRING(256),
        allowNull: false
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

var tableName = 'bank_account_details';
var modelName = 'BankAccountDetails';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;