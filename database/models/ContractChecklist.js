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
    contract_id: { type: Sequelize.UUID, allowNull: false },
    buyer_agreed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    seller_agreed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    buyer_paid_escrow_amount: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    buyer_paid_brokerage: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    seller_paid_brokerage: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    execution_started: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    execution_ended: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    full_payment_released: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    closed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE
};

var tableName = 'contract_checklists';
var modelName = 'ContractChecklist';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;