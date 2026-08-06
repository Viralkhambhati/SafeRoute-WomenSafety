const express = require("express");
const router = express.Router();

const {
  getHeatmapData,
  submitHeatmapReport,
} = require("../controllers/heatmapController");

// Get heatmap data within a radius
router.get("/", getHeatmapData);

// Submit a safety report for a location
router.post("/report", submitHeatmapReport);

module.exports = router;