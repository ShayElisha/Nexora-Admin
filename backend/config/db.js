import mongoose from "mongoose";

// Cache the connection across serverless invocations (Vercel reuses the
// module scope between warm invocations).
let cached = global._mongooseCacheSuperAdmin;
if (!cached) {
  cached = global._mongooseCacheSuperAdmin = { conn: null, promise: null };
}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("❌ MongoDB URI not found in environment variables");
    if (process.env.VERCEL) {
      throw new Error("MongoDB URI not found in environment variables");
    }
    process.exit(1);
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUri.trim(), {
        maxPoolSize: 10,
      })
      .then((mongooseInstance) => {
        console.log(`MongoDB Connected: ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error(`Error: ${error.message}`);
    if (process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }

  return cached.conn;
};

export default connectDB;
