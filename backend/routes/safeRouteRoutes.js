const express = require("express");
const router = express.Router();
const safeRouteController = require("../controllers/safeRouteController");

// POST /api/safe-route
// Body: { start: {lat, lng}, end: {lat, lng}, redZones: [{lat, lng, intensity}] }
router.post("/", safeRouteController.getSafeRoute);

module.exports = router;
