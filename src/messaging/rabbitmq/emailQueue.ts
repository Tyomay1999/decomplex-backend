import { initRabbitMQ } from "./connection";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { renderEmailTemplate } from "../email/templates";
import { sendEmail } from "../email/sender";

export interface EmailJobPayload {
  to: string;
  subject: string;
  template: string;
  variables?: Record<string, unknown>;
  language?: string;
}

export async function sendEmailJob(payload: EmailJobPayload): Promise<void> {
  const channel = await initRabbitMQ();
  const queueName = env.rabbitMqEmailQueue || "email_queue";

  const buffer = Buffer.from(JSON.stringify(payload));

  const ok = channel.sendToQueue(queueName, buffer, { persistent: true });

  logger.info(
    {
      queueName,
      ok,
      to: payload.to,
      template: payload.template,
    },
    "Email job published to RabbitMQ",
  );
}

export async function startEmailWorker(): Promise<void> {
  const channel = await initRabbitMQ();
  const queueName = env.rabbitMqEmailQueue || "email_queue";

  await channel.assertQueue(queueName, { durable: true });

  logger.info({ queueName, msg: "Email worker started, waiting for messages" });

  channel.consume(
    queueName,
    async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString("utf-8")) as EmailJobPayload;

        const { subject, html } = renderEmailTemplate(payload);

        await sendEmail({
          to: payload.to,
          subject: subject ?? payload.subject,
          html,
        });

        channel.ack(msg);

        logger.info({
          msg: "Email sent successfully",
          to: payload.to,
          template: payload.template,
        });
      } catch (err) {
        logger.error({ err, msg: "Failed to process email job, message will be dropped" });
        channel.nack(msg, false, false);
      }
    },
    { noAck: false },
  );
}
