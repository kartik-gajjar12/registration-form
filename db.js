const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "registration",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    queueLimit: 0,
});

// Check Database Connection
db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database Connection Failed:", err.code);
        console.error("➡ Error Details:", err);
    } else {
        console.log("✅ Connected to MySQL Database");
        connection.release();
    }
});

module.exports = db;
