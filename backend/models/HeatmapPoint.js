const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const HeatmapPoint = sequelize.define(
  "HeatmapPoint",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    radius: {
      type: DataTypes.FLOAT,
      defaultValue: 100,
    },
    intensity: {
      type: DataTypes.FLOAT,
      defaultValue: 0.5,
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: "safe",
    },
    reportCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    avgScore: {
      type: DataTypes.FLOAT,
      defaultValue: 5.0,
    },
    totalScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
  },
  {
    tableName: "heatmap_points",
    timestamps: true,
    underscored: true,
  }
);

module.exports = HeatmapPoint;