const { Model, DataTypes } = require('sequelize');
const db = require('../db');

const sequelize = db.getSequelize();

class Park extends Model { };

Park.init(
    {
        ACQUISITIONDATE: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ACRES: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ADDRESS: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        BOROUGH: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        CLASS: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        COMMUNITYBOARD: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        COUNCILDISTRICT: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        DEPARTMENT: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        GISOBJID: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        GISPROPNUM: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        GlobalID: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
        },
        JURISDICTION: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        LOCATION: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        MAPPED: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        NAME311: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        NYS_ASSEMBLY: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        NYS_SENATE: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        OBJECTID: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        OMPPROPID: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        PARENTID: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        PERMIT: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        PERMITDISTRICT: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        PERMITPARENT: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        PIP_RATABLE: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        PRECINCT: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        RETIRED: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        SIGNNAME: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        SUBCATEGORY: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        TYPECATEGORY: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        US_CONGRESS: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        WATERFRONT: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ZIPCODE: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Park',
        tableName: 'parks',
        timestamps: false,
    }
);

module.exports = Park;