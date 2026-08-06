// ==========================================================
// Import Database Pool
// ==========================================================

const pool = require("../config/db");

// ==========================================================
// Function : Initialize Database
// ==========================================================

const initializeDatabase = async () => {
  try {
    console.log("Checking database tables...");

    // Enable UUID Extension
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);

    // ==================================================
    // Create Users Table
    // ==================================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (

        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        name VARCHAR(100) NOT NULL,

        email VARCHAR(100) UNIQUE NOT NULL,

        password TEXT NOT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

      );
    `);

    console.log("✅ Users table is ready.");

    // ==================================================
    // Create Todos Table
    // ==================================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (

        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        title VARCHAR(255) NOT NULL,

        description TEXT,

        completed BOOLEAN DEFAULT FALSE,

        user_id UUID NOT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

      );
    `);

    console.log("✅ Todos table is ready.");

    console.log("✅ Database initialized successfully.");
  } catch (error) {
    console.error("❌ Database Initialization Failed");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = initializeDatabase;