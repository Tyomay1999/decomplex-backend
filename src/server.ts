import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { initRabbitMQ } from "./messaging/rabbitmq/connection";
import { initRedis } from "./messaging/redis/client";
import { initDatabase } from "./database";
import { startEmailWorker } from "./messaging/rabbitmq/emailQueue";

type InitFn = () => Promise<unknown>;

type RetryOptions = {
  maxAttempts?: number;
  attemptDelayMs?: number;
  backgroundRetryMs?: number;
};

async function connectWithRetry(
  serviceName: string,
  initFn: InitFn,
  options: RetryOptions = {},
): Promise<void> {
  const { maxAttempts = 3, attemptDelayMs = 2000, backgroundRetryMs = 10000 } = options;

  let attempt = 0;

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const tryOnce = async (): Promise<boolean> => {
    attempt += 1;
    try {
      await initFn();
      logger.info({ service: serviceName, attempt }, `${serviceName} connection established`);
      return true;
    } catch (err) {
      logger.error(
        { service: serviceName, attempt, err },
        `${serviceName} connection attempt failed`,
      );
      return false;
    }
  };

  while (attempt < maxAttempts) {
    const ok = await tryOnce();
    if (ok) return;
    if (attempt < maxAttempts) await delay(attemptDelayMs);
  }

  logger.error(
    { service: serviceName, maxAttempts },
    `${serviceName} failed to connect after ${maxAttempts} attempts. Will retry in background every ${backgroundRetryMs} ms.`,
  );

  const timer = setInterval(async () => {
    try {
      logger.warn({ service: serviceName }, `${serviceName} background reconnection attempt`);
      await initFn();
      logger.info({ service: serviceName }, `${serviceName} reconnected successfully`);
      clearInterval(timer);
    } catch (err) {
      logger.error({ service: serviceName, err }, `${serviceName} background reconnection failed`);
    }
  }, backgroundRetryMs);
}

async function start() {
  try {
    const initTasks: Promise<void>[] = [
      connectWithRetry("Database", initDatabase, {
        maxAttempts: 3,
        attemptDelayMs: 2000,
        backgroundRetryMs: 10000,
      }),
    ];

    if (env.redisEnabled) {
      initTasks.push(
        connectWithRetry("Redis", initRedis, {
          maxAttempts: 3,
          attemptDelayMs: 2000,
          backgroundRetryMs: 10000,
        }),
      );
    } else {
      logger.warn("Redis disabled (REDIS_ENABLED=false). Catching logic will not start.");
    }

    if (env.rabbitMqEnabled) {
      initTasks.push(
        connectWithRetry("RabbitMQ", initRabbitMQ, {
          maxAttempts: 3,
          attemptDelayMs: 2000,
          backgroundRetryMs: 10000,
        }),
      );
    } else {
      logger.warn("RabbitMQ disabled (RABBITMQ_ENABLED=false). Email worker will not start.");
    }

    await Promise.all(initTasks);

    if (env.rabbitMqEnabled) {
      await startEmailWorker();
    }

    const server = app.listen(env.port, () => {
      logger.info({ port: env.port }, "Server started");
    });

    process.on("unhandledRejection", (reason) => {
      logger.error({ msg: "Unhandled promise rejection", reason });
    });

    process.on("uncaughtException", (err) => {
      logger.error({
        msg: "Uncaught exception, shutting down",
        err:
          err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
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
  } catch (err) {
    logger.error({ err, msg: "Fatal error during server startup" });
    process.exit(1);
  }
}

start();
