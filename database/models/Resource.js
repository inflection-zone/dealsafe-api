const db = require(__dirname + '/../connection');

const Sequelize = db.Sequelize;
const sequelize = db.sequelize;

////////////////////////////////////////////////////////////////////////

const schema = {
    id: { type: Sequelize.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
    added_by: {
        type: Sequelize.UUID,
        allowNull: true,
    },
    cloud_storage_key: {
        type: Sequelize.STRING(1024),
        allowNull: false,
    },    
    mime_type: {
        type: Sequelize.STRING(128),
        allowNull: true,
    },
    is_public_resource:{
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    reference_item_id: {
        type: Sequelize.UUID,
        allowNull: true,
    },
    reference_item_keyword: {
        type: Sequelize.STRING(128),
        allowNull: true,
    },
    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE
}

var tableName = 'resources';
var modelName = 'Resource';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName,
});
module.exports.Schema = schema;
module.exports.TableName = tableName;

