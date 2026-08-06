    const { DataTypes } = require("sequelize");
    const sequelize = require("../config/db");

    const User = require("./User");

    const Todo = sequelize.define(
    "Todo",
    {
        id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        },

        title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
            msg: "Title cannot be empty",
            },
        },
        },

        description: {
        type: DataTypes.TEXT,
        allowNull: true,
        },

        completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        },

        userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",

        references: {
            model: User,
            key: "id",
        },

        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        },
    },
    {
        tableName: "todos",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
    );

    module.exports = Todo;