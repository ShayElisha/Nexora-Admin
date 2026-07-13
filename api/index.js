// Vercel serverless entry point for the SuperAdmin backend.
import app from "../backend/server.js";
import connectDB from "../backend/config/db.js";

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ success: false, message: "Database connection failed" })
    );
    return;
  }
  return app(req, res);
}
