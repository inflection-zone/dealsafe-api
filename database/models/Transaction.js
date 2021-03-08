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

    display_id: {
        type: Sequelize.STRING(64),
        allowNull: false
    },
    transaction_reference_id: {
        type: Sequelize.STRING(256),
        allowNull: false
    },
    escrow_bank_reference_id: {
        type: Sequelize.STRING(256),
        allowNull: true
    },
    contract_id: {
        type: Sequelize.UUID,
        allowNull: false
    },
    milestone_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    paid_by_id: {
        type: Sequelize.UUID,
        allowNull: false
    },
    paid_to_id: {
        type: Sequelize.UUID,
        allowNull: false
    },
    payee_account_type_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    payer_account_type_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    pay_from_account_number: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    pay_to_account_number: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    transaction_amount: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    transaction_date: {
        type: Sequelize.DATE,
        allowNull: false
    },
    transaction_initiated_by: {
        type: Sequelize.UUID,
        allowNull: true
    },
    transaction_approved_by: {
        type: Sequelize.UUID,
        allowNull: true
    },
    transaction_type: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    currency: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'INR'
    },
    payment_request_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    transaction_status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    remarks: {
        type: Sequelize.STRING(128),
        allowNull: true
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

var tableName = 'transactions';
var modelName = 'Transaction';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;