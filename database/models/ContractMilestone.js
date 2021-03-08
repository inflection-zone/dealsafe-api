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
    milestone_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    name: {
        type: Sequelize.STRING(64),
        allowNull: false
    },
    description: {
        type: Sequelize.STRING(256),
        allowNull: true
    },
    created_date: {
        type: Sequelize.DATE,
        allowNull: false
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
    milestone_amount: {
        type: Sequelize.FLOAT,
        allowNull: true
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
    transaction_id: {
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

var tableName = 'contract_milestones';
var modelName = 'ContractMilestone';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;