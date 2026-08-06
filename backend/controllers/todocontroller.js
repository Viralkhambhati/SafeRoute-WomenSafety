const Todo = require("../models/Todo");
const Subscription = require("../models/Subscription");
const webpush = require("../config/webPush");

    const getTodos = async (req, res) => {
    try {

        // Logged-in User ID
        const userId = req.user.id;

        // Fetch Only Current User Todos
        const todos = await Todo.findAll({
        where: {
            userId: userId,
        },
        order: [["created_at", "DESC"]],
        });

        res.status(200).json({
        success: true,
        count: todos.length,
        todos,
        });

    } catch (error) {

        res.status(500).json({
        success: false,
        message: error.message,
        });

    }
    };

    const createTodo = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
        return res.status(400).json({
            success: false,
            message: "Title is required",
        });
        }

        const todo = await Todo.create({
        title,
        description,
        userId: req.user.id,
        });

        // Send Push Notification to the user only
        const subscriptions = await Subscription.findAll({
        where: {
            userId: req.user.id,
        },
        });

        console.log(`[Notification] Found ${subscriptions.length} subscriptions for user ${req.user.id}`);

        if (subscriptions.length > 0) {
        const payload = JSON.stringify({
            title: "New Todo Added",
            body: title,
        });

        for (const sub of subscriptions) {
            try {
            await webpush.sendNotification(
                sub.subscription,
                payload
            );
            console.log(`[Notification] Sent notification for todo: ${title}`);
            } catch (err) {
            console.log("Notification Error:", err.message);
            }
        }
        } else {
        console.log("[Notification] No subscriptions found for user");
        }

        res.status(201).json({
        success: true,
        message: "Todo Created Successfully",
        todo,
        });

    } catch (error) {
        res.status(500).json({
        success: false,
        message: error.message,
        });
    }
    };

    const updateTodo = async (req, res) => {
    try {

        const { id } = req.params;

        // Find Todo Of Logged-in User
        const todo = await Todo.findOne({
        where: {
            id: id,
            userId: req.user.id,
        },
        });

        if (!todo) {
        return res.status(404).json({
            success: false,
            message: "Todo Not Found",
        });
        }

        const previousCompleted = todo.completed;

        // Update Fields
        todo.title = req.body.title || todo.title;
        todo.description = req.body.description || todo.description;

        if (req.body.completed !== undefined) {
            todo.completed = req.body.completed;
        }

        // Save Changes
        await todo.save();

        // Send Push Notification to the user only
        const subscriptions = await Subscription.findAll({
        where: {
            userId: req.user.id,
        },
        });

        console.log(`[Notification] Found ${subscriptions.length} subscriptions for user ${req.user.id}`);

        if (subscriptions.length > 0) {
        let notificationTitle = "Todo Updated";
        let notificationBody = todo.title;

        if (req.body.completed !== undefined && !previousCompleted && todo.completed) {
            notificationTitle = "Todo Completed";
            notificationBody = `You completed: ${todo.title}`;
        }

        const payload = JSON.stringify({
            title: notificationTitle,
            body: notificationBody,
        });

        for (const sub of subscriptions) {
            try {
            await webpush.sendNotification(
                sub.subscription,
                payload
            );
            console.log(`[Notification] Sent notification: ${notificationTitle}`);
            } catch (err) {
            console.log("Notification Error:", err.message);
            }
        }
        } else {
        console.log("[Notification] No subscriptions found for user");
        }

        res.status(200).json({
        success: true,
        message: "Todo Updated Successfully",
        todo,
        });

    } catch (error) {

        res.status(500).json({
        success: false,
        message: error.message,
        });

    }
    };

    const deleteTodo = async (req, res) => {
    try {

        const { id } = req.params;

        // Find Todo Of Logged-in User
        const todo = await Todo.findOne({
        where: {
            id: id,
            userId: req.user.id,
        },
        });

        if (!todo) {
        return res.status(404).json({
            success: false,
            message: "Todo Not Found",
        });
        }

        const todoTitle = todo.title;

        // Delete Todo
        await todo.destroy();

        // Send Push Notification to the user only
        const subscriptions = await Subscription.findAll({
        where: {
            userId: req.user.id,
        },
        });

        console.log(`[Notification] Found ${subscriptions.length} subscriptions for user ${req.user.id}`);

        if (subscriptions.length > 0) {
        const payload = JSON.stringify({
            title: "Todo Deleted",
            body: `Deleted: ${todoTitle}`,
        });

        for (const sub of subscriptions) {
            try {
            await webpush.sendNotification(
                sub.subscription,
                payload
            );
            console.log(`[Notification] Sent delete notification for: ${todoTitle}`);
            } catch (err) {
            console.log("Notification Error:", err.message);
            }
        }
        } else {
        console.log("[Notification] No subscriptions found for user");
        }

        res.status(200).json({
        success: true,
        message: "Todo Deleted Successfully",
        });

    } catch (error) {

        res.status(500).json({
        success: false,
        message: error.message,
        });

    }
    };

    module.exports = {
    getTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    };