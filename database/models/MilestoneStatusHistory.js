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

    milestone_id: {
        type: Sequelize.UUID,
        allowNull: false
    },
    status_code: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    status_name: {
        type: Sequelize.STRING(32),
        allowNull: false
    },
    updated_by: {
        type: Sequelize.UUID,
        allowNull: true
    },
    updated_on: {
        type: Sequelize.DATE,
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

var tableName = 'milestone_status_history';
var modelName = 'MilestoneStatusHistory';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;