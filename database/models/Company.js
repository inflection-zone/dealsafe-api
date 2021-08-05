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
        type: Sequelize.STRING(256),
        allowNull: false
    },
    description: {
        type: Sequelize.STRING(1024),
        allowNull: true
    },
    default_address_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    contact_email: {
        type: Sequelize.STRING(256),
        allowNull: true
    },
    contact_number: {
        type: Sequelize.STRING(256),
        allowNull: false
    },
    GSTN: {
        type: Sequelize.STRING(24),
        allowNull: true
    },
    PAN: {
        type: Sequelize.STRING(16),
        allowNull: true
    },
    TAN: {
        type: Sequelize.STRING(16),
        allowNull: false
    },
    contact_person_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    subscription_type: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'On-premises'
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

var tableName = 'companies';
var modelName = 'Company';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;