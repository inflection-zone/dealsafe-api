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
    contract_id: {
        type: Sequelize.UUID,
        allowNull: false
    },
    milestone_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    requested_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false
    },
    requested_to_user_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    requested_to_company_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    amount: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    remarks: {
        type: Sequelize.STRING(256),
        allowNull: true
    },
    request_date: {
        type: Sequelize.DATE,
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

var tableName = 'payment_requests';
var modelName = 'PaymentRequest';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;