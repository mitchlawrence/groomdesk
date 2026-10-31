import pg from "pg";
import { env } from "../config/env.js";

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
});

pool.on("error", (err) => {
  console.error("Unexpected database connection error:", err.message);
});
