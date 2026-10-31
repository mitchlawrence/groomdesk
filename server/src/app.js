import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import { HttpError } from "./utils/http-error.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

app.use("/api/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { message: "Not found" } });
});

app.use((err, req, res, _next) => {
  const isClientError = err.status >= 400 && err.status < 500;
  if (!isClientError) console.error(err);
  res.status(isClientError ? err.status : 500).json({
    error: {
      message: isClientError ? "Invalid request" : "Internal server error",
    },
  });
});

export default app;
