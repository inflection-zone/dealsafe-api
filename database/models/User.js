const db = require(__dirname + '/../connection');
var bcryptjs = require('bcryptjs');
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
    first_name: {
        type: Sequelize.STRING(64),
        allowNull: false
    },
    last_name: {
        type: Sequelize.STRING(64),
        allowNull: false
    },
    prefix: {
        type: Sequelize.STRING(16),
        allowNull: false
    },
    phone: {
        type: Sequelize.STRING(16),
        allowNull: true
    },
    email: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    user_name: {
        type: Sequelize.STRING(30),
        allowNull: true
    },
    password: {
        type: Sequelize.STRING(256),
        allowNull: false
    },
    profile_picture: {
        type: Sequelize.STRING(256),
        allowNull: true
    },
    gender: {
        type: Sequelize.STRING(32),
        allowNull: true
    },
    birth_date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    company_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    company_type: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    is_contact_person_for_organization: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    primary_address_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
    },
    last_login: {
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

var tableName = 'users';
var modelName = 'User';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName,
    hooks: {
        beforeCreate: (user) => {
          user.password = bcryptjs.hashSync(user.password, bcryptjs.genSaltSync(8), null);
        }
      }
});
module.exports.Schema = schema;
module.exports.TableName = tableName;