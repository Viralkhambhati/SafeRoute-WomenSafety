    const express = require("express");
    const router = express.Router();

    const Subscription = require("../models/Subscription");

    const {
    sendNotification,
    } = require("../controllers/notificationController");

    const authMiddleware = require("../middleware/authMiddleware");

    // Get VAPID Public Key
    router.get("/vapid-public-key", (req, res) => {
        res.json({
        publicKey: process.env.VAPID_PUBLIC_KEY,
        });
    });

    // Save Browser Subscription
    router.post("/subscribe", authMiddleware, async (req, res) => {
        try {
            await Subscription.create({
            userId: req.user.id,
            subscription: req.body,
            });

            res.json({
            success: true,
            message: "Subscription Saved",
            });
        } catch (error) {
            res.status(500).json({
            success: false,
            message: error.message,
            });
        }
    });

    // Unsubscribe
    router.delete("/unsubscribe", authMiddleware, async (req, res) => {
        try {
            await Subscription.destroy({
            where: {
                userId: req.user.id,
            },
            });

            res.json({
            success: true,
            message: "Unsubscribed Successfully",
            });
        } catch (error) {
            res.status(500).json({
            success: false,
            message: error.message,
            });
        }
    });

    // Send Notification
    router.post(
    "/send",
    authMiddleware,
    sendNotification
    );

    module.exports = router;