    const express = require("express");
    const cors = require("cors");
    require("dotenv").config();

    const authRoutes = require("./routes/authRoutes");
    const notificationRoutes = require("./routes/notificationRoutes");
    const heatmapRoutes = require("./routes/heatmapRoutes");
    const safeRouteRoutes = require("./routes/safeRouteRoutes");

    const sequelize = require("./config/db");
    const initializeDatabase = require("./database/init");

    const app = express();

    const PORT = process.env.PORT || 5000;

    const corsOptions = {
      origin: (origin, callback) => {
        const frontendUrl = process.env.FRONTEND_URL;
        const allowedOrigins = new Set();

        if (frontendUrl && frontendUrl !== "*") {
          allowedOrigins.add(frontendUrl);
        }

        allowedOrigins.add("http://localhost:5173");
        allowedOrigins.add("http://localhost:3000");
        allowedOrigins.add("http://localhost:5000");
        allowedOrigins.add("http://127.0.0.1:5173");
        allowedOrigins.add("http://127.0.0.1:3000");
        allowedOrigins.add("http://127.0.0.1:5000");

        const isLocalNetworkOrigin =
          origin &&
          (origin.startsWith("http://192.168.") ||
            origin.startsWith("http://10.") ||
            origin.startsWith("http://172."));

        if (!origin || allowedOrigins.has(origin) || isLocalNetworkOrigin || frontendUrl === "*") {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
    };
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is Running Successfully",
    });
    });

    app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SafeRoute API is healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: "connected",
    });
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/heatmap", heatmapRoutes);
    app.use("/api/safe-route", safeRouteRoutes);

    app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found",
    });
    });

    async function connectDB() {
    try {

    console.log("Connecting to PostgreSQL...");

    await sequelize.authenticate();

    console.log("PostgreSQL Connected Successfully");

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is Running on Port ${PORT}`);
        console.log(`Local URL: http://localhost:${PORT}`);
        console.log(`Network URL: http://10.133.41.185:${PORT}`);
    });

    } catch (error) {

    console.error("PostgreSQL Connection Failed");
    console.error(error.message);

    process.exit(1);

    }
}

    connectDB();


    // async function startServer() {

    //   try {

    //     // Step 1 : Connect Database
    //     await connectDB();

    //     // Step 2 : Create Tables
    //     await initializeDatabase();

    //     // Step 3 : Start Express Server
        

    //   } catch (error) {

    //     console.error(error);

    //   }

    // }

    // startServer();


