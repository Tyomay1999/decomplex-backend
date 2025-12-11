import amqp, { Connection, Channel } from "amqplib";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function initRabbitMQ(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  const url = env.RABBITMQ_URL;
  const queueName = env.RABBITMQ_EMAIL_QUEUE || "email_queue";

  connection = await amqp.connect(url);
  channel = await connection.createChannel();

  await channel.assertQueue(queueName, {
    durable: true,
  });

  logger.info({ queueName, msg: "RabbitMQ initialized and email queue asserted" });

  process.on("SIGTERM", async () => {
    try {
      if (channel) {
        await channel.close();
      }
      if (connection) {
        await connection.close();
      }
      logger.info("RabbitMQ connection closed (SIGTERM)");
    } catch (err) {
      logger.error({ err, msg: "Error while closing RabbitMQ on SIGTERM" });
    }
  });

  return channel;
}

export function getRabbitChannel(): Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized. Call initRabbitMQ() first.");
  }
  return channel;
}
