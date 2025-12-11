import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";

const port = env.port;

const server = app.listen(port, () => {
  logger.info({ msg: "Server is listening", port });
});

process.on("unhandledRejection", (reason) => {
  logger.error({
    msg: "Unhandled promise rejection",
    reason,
  });
});

process.on("uncaughtException", (err) => {
  logger.error({
    msg: "Uncaught exception, shutting down",
    err: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
  });
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info({ msg: "SIGTERM received, shutting down gracefully" });
  server.close(() => {
    logger.info({ msg: "HTTP server closed" });
    process.exit(0);
  });
});
