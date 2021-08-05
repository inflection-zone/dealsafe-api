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
    name: {
        type: Sequelize.STRING(64),
        allowNull: false
    },
    description: {
        type: Sequelize.STRING(256),
        allowNull: true
    },
    is_full_payment_contract: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    buyer_company_id: {
        type: Sequelize.UUID,
        allowNull: false
    },
    buyer_contact_user_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    seller_company_id: {
        type: Sequelize.UUID,
        allowNull: false
    },
    seller_contact_user_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    created_date: {
        type: Sequelize.DATE,
        allowNull: false
    },
    creator_role: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false
    },
    buyer_agreed_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    seller_agreed_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    execution_planned_start_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    execution_planned_end_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    execution_actual_start_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    execution_actual_end_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    base_contract_amount: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    tax_amount: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    buyer_brokerage_amount: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    seller_brokerage_amount: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    has_buyer_deposited_amount: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    has_seller_deposited_amount: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    current_status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    is_cancelled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    is_closed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    arbitrator_user_id: {
        type: Sequelize.UUID,
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

var tableName = 'contracts';
var modelName = 'Contract';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;