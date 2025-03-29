const db = require("../db");

const createUserTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      role ENUM('customer', 'admin') NOT NULL,
      is_verified BOOLEAN DEFAULT 0,
      verification_token VARCHAR(255)
    )
  `;

    try {
        await db.execute(query);
        console.log("✅ Users table created successfully!");
    } catch (error) {
        console.error("❌ Error creating users table:", error);
    }
};



module.exports = { createUserTable };
