    const webpush = require("../config/webPush");
    const Subscription = require("../models/Subscription");

    exports.sendNotification = async (
    req,
    res
    ) => {
    try {
        const subscriptions =
        await Subscription.find();

        const payload = JSON.stringify({
        title: "TODO App Notification",
        body: "This is a test notification from the TODO App",
        });

        for (const sub of subscriptions) {
        await webpush.sendNotification(
            sub.subscription,
            payload
        );
        }

        res.json({
        success: true,
        });
    } catch (error) {
        res.status(500).json({
        message: error.message,
        });
    }
    };