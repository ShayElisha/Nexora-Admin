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

const buildAllowedOrigins = () => {
  const origins = new Set([
    "http://localhost:5173",
    "http://localhost:5174",
  ]);

  for (const raw of (process.env.FRONTEND_URL || "").split(",")) {
    const url = raw.trim();
    if (url) origins.add(url.replace(/\/$/, ""));
  }

  // Vercel injects these per deployment (no protocol). Covers production + previews.
  for (const host of [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    if (!host) continue;
    const hostname = host.replace(/^https?:\/\//, "").replace(/\/$/, "");
    origins.add(`https://${hostname}`);
  }

  return origins;
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:")
  ) {
    return true;
  }

  const allowed = buildAllowedOrigins();
  if (allowed.has(origin.replace(/\/$/, ""))) return true;

  // Same Vercel project: browser Origin is the frontend URL while /api is
  // rewritten to the backend service — allow related *.vercel.app hosts.
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== "https:" || !hostname.endsWith(".vercel.app")) {
      return false;
    }

    const productionHost = (
      process.env.VERCEL_PROJECT_PRODUCTION_URL || ""
    ).replace(/^https?:\/\//, "");
    if (productionHost && hostname === productionHost) return true;

    // Preview deployments: <project>-<hash>-<team>.vercel.app
    const projectSlug = productionHost.split(".")[0];
    if (projectSlug && hostname.startsWith(`${projectSlug}-`)) return true;

    // Fallback when production URL env is missing but we are on Vercel
    if (process.env.VERCEL === "1" || process.env.VERCEL === "true") {
      return hostname.startsWith("nexora-admin");
    }
  } catch {
    return false;
  }

  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/communication", communicationRoutes);

app.get("/", (req, res) => res.send("Server is running!"));

// Connect to the database (cached across invocations).
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // The in-process scheduler needs a persistent process. It runs locally by
  // default, and on Vercel only when ENABLE_SCHEDULER=true (otherwise use
  // Vercel Cron, since Fluid compute can scale to zero).
  if (!isServerless || process.env.ENABLE_SCHEDULER === "true") {
    startScheduler();
  }
});

export default app;
