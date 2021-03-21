const db = require(__dirname + '/../connection');

const Sequelize = db.Sequelize;
const sequelize = db.sequelize;

////////////////////////////////////////////////////////////////////////

const schema = {
    id: { type: Sequelize.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },

    user_id: { type: Sequelize.UUID, allowNull: true },
    user_name: { type: Sequelize.STRING(30), allowNull: true },
    phone: { type: Sequelize.STRING(15), allowNull: true },

    OTP: { type: Sequelize.STRING(6), allowNull: false },
    valid_from: { type: Sequelize.DATE, allowNull: true },
    valid_to: { type: Sequelize.DATE, allowNull: true },
    validated: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },

    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE
}

var tableName = 'otp';
var modelName = 'OTP';

////////////////////////////////////////////////////////////////////////

module.exports.Model = sequelize.define(modelName, schema, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    tableName: tableName
});
module.exports.Schema = schema;
module.exports.TableName = tableName;
