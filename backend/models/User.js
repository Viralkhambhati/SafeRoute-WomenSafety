    const { DataTypes } = require("sequelize");
    const sequelize = require("../config/db");

    const User = sequelize.define(
    "User",
    {
        id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        },

        name: {
        type: DataTypes.STRING,
        allowNull: false,
        },

        email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
        },

        password: {
        type: DataTypes.TEXT,
        allowNull: false,
        },
    },
    {
        tableName: "users",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
    );

    module.exports = User;