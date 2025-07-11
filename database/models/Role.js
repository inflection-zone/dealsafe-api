const db = require(__dirname + '/../connection');

const Sequelize = db.Sequelize;
const sequelize = db.sequelize;

////////////////////////////////////////////////////////////////////////

const schema = {

    id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },

    name: {
        type: Sequelize.STRING(128),
        allowNull: false
    },
    description: {
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

var tableName = 'roles';
var modelName = 'Role';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;