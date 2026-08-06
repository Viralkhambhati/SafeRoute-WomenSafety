    const { DataTypes } = require("sequelize");
    const sequelize = require("../config/db");

    const User = require("./User");

    const Subscription = sequelize.define(
    "Subscription",
    {
        id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        },

        subscription: {
        type: DataTypes.JSONB,
        allowNull: false,
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
        tableName: "subscriptions",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
    );

    module.exports = Subscription;