import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import communicationRoutes from "./routes/communicationRoutes.js";
import cors from "cors";
import { startScheduler } from "./services/scheduler.service.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const isServerless = Boolean(process.env.VERCEL);

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration - Allow all localhost origins in development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development (default), allow all localhost origins
    const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV !== 'production';
    const isLocalhost = origin && (
      origin.startsWith('http://localhost:') || 
      origin.startsWith('http://127.0.0.1:')
    );
    
    // Always allow localhost in development (default behavior)
    if (isDevelopment && isLocalhost) {
      console.log(`[CORS] Allowing localhost origin: ${origin}`);
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : ["http://localhost:5173", "http://localhost:5174"];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/communication", communicationRoutes);

app.get("/", (req, res) => res.send("Server is running!"));

// Local / long-running server startup only. On Vercel the app is invoked as a
// serverless function (see /api/index.js): no app.listen() and no persistent
// scheduler process.
if (!isServerless) {
  connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start the message scheduler
    startScheduler();
  });
}

export default app;
