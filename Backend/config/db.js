const mongoose = require("mongoose");

/**
 * Connects to MongoDB database using MONGO_URI env variable.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not defined");
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ DB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
