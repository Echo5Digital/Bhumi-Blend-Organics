import { z } from "zod";

// All settings come from environment variables (the `.env` file in development,
// the host's settings in production). They are checked once, at start-up, so a
// missing database link or a too-short secret stops the server immediately with
// a clear message instead of failing on the first request.

// An empty `KEY=` line in .env means "not set".
const blankToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);
const optionalText = z.preprocess(blankToUndefined, z.string().optional());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  CLIENT_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim().replace(/\/+$/, ""))
        .filter(Boolean),
    ),

  MONGODB_URI: z
    .string({ error: "MONGODB_URI is missing — add your MongoDB connection link to backend/.env" })
    .min(1, "MONGODB_URI is empty — add your MongoDB connection link to backend/.env")
    .regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI must start with mongodb:// or mongodb+srv://"),

  JWT_SECRET: z
    .string({ error: "JWT_SECRET is missing — add a long random text to backend/.env" })
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  /** How long an admin stays logged in. */
  JWT_EXPIRES_IN: z.string().default("12h"),
  /** How long a shopper stays logged in on their device. */
  CUSTOMER_JWT_EXPIRES_IN: z.string().default("30d"),

  CLOUDINARY_CLOUD_NAME: optionalText,
  CLOUDINARY_API_KEY: optionalText,
  CLOUDINARY_API_SECRET: optionalText,
  CLOUDINARY_FOLDER: z.preprocess(blankToUndefined, z.string().default("bhumiblend")),

  // Outgoing email (verification codes). Without SMTP_HOST + MAIL_FROM the codes are
  // printed in the server's console in development, and sign-ups are refused in production.
  SMTP_HOST: optionalText,
  SMTP_PORT: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(65535).default(587)),
  /** true for port 465 (TLS from the start); false for 587 / 25 (the connection upgrades itself). */
  SMTP_SECURE: z.preprocess(blankToUndefined, z.enum(["true", "false"]).default("false").transform((value) => value === "true")),
  SMTP_USER: optionalText,
  SMTP_PASS: optionalText,
  /** The "From" of every email, e.g. Bhumi Blend <no-reply@bhumiblend.com> */
  MAIL_FROM: optionalText,

  // So admin edits show on the storefront at once: after a change, the backend asks the storefront to
  // refresh its cached pages. Needs both; without them pages still refresh on their own every minute.
  STOREFRONT_URL: z.preprocess(blankToUndefined, z.url().optional()),
  REVALIDATE_SECRET: z.preprocess(blankToUndefined, z.string().min(16, "REVALIDATE_SECRET must be at least 16 characters long").optional()),

  RAZORPAY_KEY_ID: optionalText,
  RAZORPAY_KEY_SECRET: optionalText,
  RAZORPAY_WEBHOOK_SECRET: optionalText,
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  - ${issue.path.join(".") || "env"}: ${issue.message}`);
    throw new Error(`Invalid environment settings:\n${lines.join("\n")}\n\nSee backend/.env.example.`);
  }
  return result.data;
}
