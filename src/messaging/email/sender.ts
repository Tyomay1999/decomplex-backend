import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const t = getTransporter();

  const from =
    env.smtpFromName && env.smtpFromEmail
      ? `"${env.smtpFromName}" <${env.smtpFromEmail}>`
      : env.smtpFromEmail;

  const info = await t.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  logger.info({
    msg: "SMTP email sent",
    to: input.to,
    messageId: info.messageId,
  });
}
