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

    contract_id: {
        type: Sequelize.UUID,
        allowNull: false
    },
    milestone_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    reason: {
        type: Sequelize.STRING(256),
        allowNull: false
    },
    raised_by: {
        type: Sequelize.UUID,
        allowNull: false
    },
    raised_date: {
        type: Sequelize.DATE,
        allowNull: false
    },
    resolution_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    is_resolved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    resolution_dates: {
        type: Sequelize.STRING(256),
        allowNull: true
    },
    is_blocking: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

var tableName = 'contract_disputes';
var modelName = 'ContractDispute';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;