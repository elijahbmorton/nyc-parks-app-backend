const { Sequelize, Model, DataTypes } = require('sequelize');
const db = require('../db');

const sequelize = db.getSequelize();

class Report extends Model { }

Report.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        reporterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reviewId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'resolved'),
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
        modelName: 'Report',
        tableName: 'reports',
        timestamps: false,
    }
);

module.exports = Report;
