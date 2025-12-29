const { Sequelize, Model, DataTypes } = require('sequelize');
const db = require('../db');

const sequelize = db.getSequelize();

class Friend extends Model { }

Friend.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        friendId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
            allowNull: false,
            defaultValue: 'pending',
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
        },
    },
    {
        sequelize,
        modelName: 'Friend',
        tableName: 'friends',
        timestamps: false,
        indexes: [{ unique: true, fields: ['userId', 'friendId'] }],
    }
);

Friend.sync()
    .then(() => {
        console.info('friends table created successfully!');
    })
    .catch((e) => {
        console.error('Error creating friends table:', e);
    });

module.exports = Friend;
