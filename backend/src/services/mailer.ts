import nodemailer from "nodemailer";
import type { Env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";

// Outgoing email, behind a small interface (like payments and images) so the
// tests never send anything.
//
// - SMTP settings in .env  → real email through that SMTP server.
// - No SMTP, development   → the message is printed in this server's console, so
//                            sign-up can be tried before an SMTP account exists.
// - No SMTP, production    → `configured` is false and sending fails with 503, so
//                            the site never pretends to have emailed a code.

export type MailMessage = { to: string; subject: string; text: string; html?: string };

export interface Mailer {
  readonly configured: boolean;
  send(message: MailMessage): Promise<void>;
}

type MailEnv = Pick<Env, "NODE_ENV" | "SMTP_HOST" | "SMTP_PORT" | "SMTP_SECURE" | "SMTP_USER" | "SMTP_PASS" | "MAIL_FROM">;

export function createMailer(env: MailEnv): Mailer {
  if (env.SMTP_HOST && env.MAIL_FROM) {
    const from = env.MAIL_FROM;
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? "" } : undefined,
      // Give up quickly instead of leaving a shopper staring at a spinner.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    return {
      configured: true,
      async send(message) {
        try {
          await transport.sendMail({ from, ...message });
        } catch (error) {
          // The reason can mention the SMTP account, so it goes to the log, not to the shopper.
          console.error("Sending email failed:", error instanceof Error ? error.message : error);
          throw new HttpError(502, "EMAIL_FAILED", "We couldn't send the email just now. Please try again in a moment.");
        }
      },
    };
  }

  if (env.NODE_ENV === "production") {
    return {
      configured: false,
      async send() {
        throw HttpError.unavailable("Email is not set up yet, so we can't send verification codes.", "EMAIL_NOT_CONFIGURED");
      },
    };
  }

  return {
    configured: false,
    async send(message) {
      console.log(`\n[DEV MAIL — SMTP is not configured, so nothing was sent]\nTo: ${message.to}\nSubject: ${message.subject}\n${message.text}\n`);
    },
  };
}
