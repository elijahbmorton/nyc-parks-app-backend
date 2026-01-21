const { Sequelize, Model, DataTypes } = require('sequelize');
const db = require('../db');

const sequelize = db.getSequelize();

class User extends Model { }

// https://www.backyardgardenlover.com/new-york-native-plants-list/
// TODO: add Ironweed, Echinacea, Milkweed, Trumpet creeper, bee balm, culver's root

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        profileImage: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: false,
    }
);

module.exports = User;
