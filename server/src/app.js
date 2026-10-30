import express from "express";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

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
