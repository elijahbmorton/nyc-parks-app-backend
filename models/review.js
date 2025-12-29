const { Sequelize, Model, DataTypes } = require('sequelize');
const db = require('../db');

const sequelize = db.getSequelize();

class Review extends Model { }

Review.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        parkId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        comments: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        favorite: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
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
        modelName: 'Review',
        tableName: 'reviews',
        timestamps: false,
    }
);

Review.sync()
    .then(() => {
        console.info('reviews table created successfully!');
    })
    .catch((e) => {
        console.error('Error creating reviews table:', e);
    });

module.exports = Review;
