
import mongoose from "mongoose";
import dns from "node:dns";

const connectDB = async () => {
  try {
    // Use Google DNS for MongoDB SRV resolution
    dns.setServers(["8.8.8.8", "8.8.4.4"]);

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
