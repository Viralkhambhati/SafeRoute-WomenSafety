const { Op } = require("sequelize");
const HeatmapPoint = require("../models/HeatmapPoint");

const getHeatmapData = async (req, res) => {
  try {
    const { lat, lng, radius, north, south, east, west } = req.query;

    let whereClause = {};

    if (north != null && south != null && east != null && west != null) {
      const minLat = Math.min(parseFloat(south), parseFloat(north));
      const maxLat = Math.max(parseFloat(south), parseFloat(north));
      const minLng = Math.min(parseFloat(west), parseFloat(east));
      const maxLng = Math.max(parseFloat(west), parseFloat(east));

      whereClause = {
        lat: { [Op.between]: [minLat, maxLat] },
        lng: { [Op.between]: [minLng, maxLng] },
      };
    } else if (lat != null && lng != null) {
      const searchRadius = parseFloat(radius) || 5;
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);

      whereClause = {
        lat: {
          [Op.between]: [
            centerLat - searchRadius / 111,
            centerLat + searchRadius / 111,
          ],
        },
        lng: {
          [Op.between]: [
            centerLng - searchRadius / (111 * Math.cos(centerLat * (Math.PI / 180))),
            centerLng + searchRadius / (111 * Math.cos(centerLat * (Math.PI / 180))),
          ],
        },
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Viewport bounds or center coordinates are required",
      });
    }

    const points = await HeatmapPoint.findAll({
      where: whereClause,
      limit: 500,
      order: [["intensity", "DESC"]],
    });

    const data = points.map((point) => ({
      lat: point.lat,
      lng: point.lng,
      intensity: point.intensity,
      category: point.category,
      avgScore: point.avgScore,
      reportCount: point.reportCount,
    }));

    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const submitHeatmapReport = async (req, res) => {
  try {
    const { lat, lng, score, category } = req.body;

    if (lat == null || lng == null || score == null) {
      return res.status(400).json({
        success: false,
        message: "Latitude, longitude, and score are required",
      });
    }

    if (score < 1 || score > 10) {
      return res.status(400).json({
        success: false,
        message: "Score must be between 1 and 10",
      });
    }

    const safeLat = parseFloat(lat);
    const safeLng = parseFloat(lng);
    const safeScore = parseFloat(score);
    const safeCategory = category || (safeScore < 4 ? "risky" : safeScore < 7 ? "moderate" : "safe");

    const existingPoint = await HeatmapPoint.findOne({
      where: {
        lat: { [Op.between]: [safeLat - 0.001, safeLat + 0.001] },
        lng: { [Op.between]: [safeLng - 0.001, safeLng + 0.001] },
      },
    });

    if (existingPoint) {
      const newCount = existingPoint.reportCount + 1;
      const newTotalScore = existingPoint.totalScore + safeScore;
      const newAvgScore = newTotalScore / newCount;

      await existingPoint.update({
        reportCount: newCount,
        totalScore: newTotalScore,
        avgScore: parseFloat(newAvgScore.toFixed(2)),
        intensity: parseFloat(newAvgScore <= 4 ? 0.3 : newAvgScore <= 7 ? 0.6 : 1.0),
        category: newAvgScore <= 4 ? "risky" : newAvgScore <= 7 ? "moderate" : "safe",
      });

      res.json({
        success: true,
        message: "Report submitted successfully",
        point: existingPoint,
      });
    } else {
      const newPoint = await HeatmapPoint.create({
        lat: safeLat,
        lng: safeLng,
        intensity: parseFloat(safeScore <= 4 ? 0.3 : safeScore <= 7 ? 0.6 : 1.0),
        category: safeScore <= 4 ? "risky" : safeScore <= 7 ? "moderate" : "safe",
        reportCount: 1,
        avgScore: safeScore,
        totalScore: safeScore,
      });

      res.status(201).json({
        success: true,
        message: "Report submitted successfully",
        point: newPoint,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getHeatmapData,
  submitHeatmapReport,
};