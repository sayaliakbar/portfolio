const mongoose = require("mongoose");

// MongoDB connection options
const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  family: 4,
  retryWrites: true,
  retryReads: true,
  maxIdleTimeMS: 30000,
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    const conn = await mongoose.connect(
      process.env.MONGO_URI,
      connectionOptions
    );
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    // Handle process termination
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed due to app termination");
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (error.name === "MongooseError") {
      console.error("Mongoose specific error details:", error);
    }
    console.log("Retrying connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
