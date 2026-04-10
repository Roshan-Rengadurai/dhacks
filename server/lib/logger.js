/**
 * Structured logger — outputs JSON lines with timestamp, level, route, and message.
 * Lightweight (no deps), easy to pipe into any log aggregator.
 */

function formatEntry(level, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    route: meta.route || null,
    method: meta.method || null,
    status: meta.status || null,
    message: meta.message || "",
    ...(meta.error ? { error: meta.error } : {}),
    ...(meta.duration ? { duration_ms: meta.duration } : {}),
  });
}

const logger = {
  info: (meta) => console.log(formatEntry("info", meta)),
  warn: (meta) => console.warn(formatEntry("warn", meta)),
  error: (meta) => console.error(formatEntry("error", meta)),
};

module.exports = logger;
