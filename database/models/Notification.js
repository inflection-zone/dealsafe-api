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

    user_id: {
        type: Sequelize.STRING(64),
        allowNull: false
    },
    notification_type: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    details_json_object: {
        type: Sequelize.STRING(1024),
        allowNull: true
    },
    text: {
        type: Sequelize.STRING(1024),
        allowNull: false
    },
    generated_on: {
        type: Sequelize.DATE,
        allowNull: false
    },
    read_date: {
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

var tableName = 'notifications';
var modelName = 'Notification';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;