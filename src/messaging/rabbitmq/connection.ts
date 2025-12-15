import * as amqp from "amqplib";
import type { Channel, ChannelModel } from "amqplib";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export async function initRabbitMQ(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  const url = env.rabbitMQUrl;
  const queueName = env.rabbitMqEmailQueue || "email_queue";

  const conn: ChannelModel = await amqp.connect(url);
  const createdChannel: Channel = await conn.createChannel();

  connection = conn;
  channel = createdChannel;

  await createdChannel.assertQueue(queueName, { durable: true });

  logger.info({
    queueName,
    msg: "RabbitMQ initialized and email queue asserted",
  });

  process.once("SIGTERM", async () => {
    try {
      if (channel) {
        await channel.close();
        channel = null;
      }
      if (connection) {
        await connection.close();
        connection = null;
      }
      logger.info("RabbitMQ connection closed (SIGTERM)");
    } catch (err) {
      logger.error({ err, msg: "Error while closing RabbitMQ on SIGTERM" });
    }
  });

  return createdChannel;
}

export function getRabbitChannel(): Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized. Call initRabbitMQ() first.");
  }
  return channel;
}
