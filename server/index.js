require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const logger = require("./lib/logger");
const entriesRouter = require("./routes/entries");

const app = express();

// Update this origin when deploying the frontend somewhere other than localhost
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());

// --- Rate limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — slow down and try again in a few minutes" },
});
app.use("/api", apiLimiter);

// --- Request logging ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info({
      method: req.method,
      route: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start,
    });
  });
  next();
});

app.use("/api/entries", entriesRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Global error handler ---
app.use((err, req, res, _next) => {
  logger.error({
    method: req.method,
    route: req.originalUrl,
    message: err.message,
    error: err.stack,
  });
  res.status(500).json({ error: "Something broke — we're looking into it" });
});

const PORT = process.env.EXPRESS_PORT || 4000;
app.listen(PORT, () => {
  logger.info({ message: `Terrain API running → http://localhost:${PORT}` });
});
