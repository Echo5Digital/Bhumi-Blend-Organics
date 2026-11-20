import { SMTPServer } from "smtp-server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadEnv } from "../src/config/env.js";
import { HttpError } from "../src/lib/httpError.js";
import { verificationEmail } from "../src/services/emailTemplates.js";
import { logoAttachment } from "../src/services/emailLogo.js";
import { createMailer } from "../src/services/mailer.js";
import { renderWelcomeEmail, sampleCustomer } from "../src/services/welcomeEmail.js";

// The real SMTP code is exercised against a tiny SMTP server running inside the test,
// so these prove an email genuinely goes out over SMTP — without needing an account.

const base = { SMTP_PORT: 587, SMTP_SECURE: false } as const;
const message = verificationEmail({ to: "shopper@example.com", firstName: "Asha", code: "482915", minutes: 10 });

type Received = { raw: string; from: string; to: string[]; user?: string };

async function startSmtp(options: { user?: string; pass?: string } = {}) {
  const received: Received[] = [];
  const server = new SMTPServer({
    logger: false,
    authOptional: !options.user,
    allowInsecureAuth: true, // no TLS in the test
    disabledCommands: ["STARTTLS"],
    onAuth(auth, _session, callback) {
      if (auth.username === options.user && auth.password === options.pass) callback(null, { user: auth.username });
      else callback(new Error("Invalid login"));
    },
    onMailFrom(address, _session, callback) {
      current.from = address.address;
      callback();
    },
    onRcptTo(address, _session, callback) {
      current.to.push(address.address);
      callback();
    },
    onData(stream, session, callback) {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => {
        received.push({ raw: Buffer.concat(chunks).toString("utf8"), from: current.from, to: [...current.to], user: (session.user as string | undefined) ?? undefined });
        current = { from: "", to: [] };
        callback();
      });
    },
  });
  let current: { from: string; to: string[] } = { from: "", to: [] };
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.server.address() as { port: number }).port;
  return { port, received, close: () => new Promise<void>((resolve) => server.close(() => resolve())) };
}

const closers: (() => Promise<void>)[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  while (closers.length) await closers.pop()!();
});

describe("the verification email", () => {
  it("shows the code in the subject, the text and the HTML", () => {
    expect(message.subject).toBe("482915 is your Bhumi Blend verification code");
    expect(message.text).toContain("482915");
    expect(message.text).toContain("10 minutes");
    expect(message.html).toContain("482915");
  });

  it("can't be used to inject markup through the name", () => {
    const evil = verificationEmail({ to: "a@b.co", firstName: '<img src=x onerror="alert(1)">', code: "111111", minutes: 10 });
    expect(evil.html).not.toContain("<img");
    expect(evil.html).toContain("&lt;img");
  });
});

describe("sending through SMTP", () => {
  it("delivers the email to the SMTP server", async () => {
    const smtp = await startSmtp();
    closers.push(smtp.close);
    const mailer = createMailer({ ...base, NODE_ENV: "production", SMTP_HOST: "127.0.0.1", SMTP_PORT: smtp.port, MAIL_FROM: "Bhumi Blend <no-reply@example.com>" });
    expect(mailer.configured).toBe(true);

    await mailer.send(message);

    expect(smtp.received).toHaveLength(1);
    const [mail] = smtp.received;
    expect(mail!.from).toBe("no-reply@example.com");
    expect(mail!.to).toEqual(["shopper@example.com"]);
    expect(mail!.raw).toContain("From: Bhumi Blend <no-reply@example.com>");
    expect(mail!.raw).toContain("To: shopper@example.com");
    expect(mail!.raw).toContain("Subject: 482915 is your Bhumi Blend verification code");
    expect(mail!.raw).toContain("Hi Asha");
    expect(mail!.raw).toContain("text/html");
  });

  it("carries the logo inside the welcome email as an inline picture", async () => {
    const smtp = await startSmtp();
    closers.push(smtp.close);
    const mailer = createMailer({ ...base, NODE_ENV: "production", SMTP_HOST: "127.0.0.1", SMTP_PORT: smtp.port, MAIL_FROM: "Bhumi Blend <no-reply@example.com>" });
    const welcome = renderWelcomeEmail(sampleCustomer(), { enabled: true, recipients: "", subject: "", heading: "", additionalContent: "", format: "html" }, { siteName: "Bhumi Blend Organics", storefrontUrl: "http://localhost:3000" });

    await mailer.send({ to: "john@example.com", subject: welcome.subject, text: welcome.text, html: welcome.html, attachments: welcome.attachments });

    const raw = smtp.received[0]!.raw;
    expect(raw).toContain("Subject: Welcome to Bhumi Blend Organics! Your account is ready");
    expect(raw).toContain("multipart/related"); // the HTML and its picture travel together
    expect(raw).toContain("Content-Type: image/png");
    expect(raw).toContain("Content-ID: <bb-logo>"); // what <img src="cid:bb-logo"> points at
    expect(raw).toContain("Content-Disposition: inline");
    // the PNG's own bytes, base64-encoded, are in the message (its first line is enough to tell)
    expect(raw.replace(/\r?\n/g, "")).toContain(logoAttachment()!.content.toString("base64").slice(0, 64));
  });

  it("logs in with the SMTP username and password when they're set", async () => {
    const smtp = await startSmtp({ user: "mailer", pass: "s3cret" });
    closers.push(smtp.close);
    const good = createMailer({ ...base, NODE_ENV: "production", SMTP_HOST: "127.0.0.1", SMTP_PORT: smtp.port, SMTP_USER: "mailer", SMTP_PASS: "s3cret", MAIL_FROM: "no-reply@example.com" });
    await good.send(message);
    expect(smtp.received[0]?.user).toBe("mailer");
  });

  it("reports a wrong SMTP password as a clean 502 without leaking the reason", async () => {
    const smtp = await startSmtp({ user: "mailer", pass: "s3cret" });
    closers.push(smtp.close);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const bad = createMailer({ ...base, NODE_ENV: "production", SMTP_HOST: "127.0.0.1", SMTP_PORT: smtp.port, SMTP_USER: "mailer", SMTP_PASS: "wrong", MAIL_FROM: "no-reply@example.com" });
    const error = await bad.send(message).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 502, code: "EMAIL_FAILED" });
    expect(String((error as Error).message)).not.toMatch(/Invalid login|mailer|wrong/);
    expect(smtp.received).toHaveLength(0);
  });

  it("reports an unreachable SMTP server as a clean 502", async () => {
    const smtp = await startSmtp();
    const deadPort = smtp.port;
    await smtp.close(); // nothing is listening there any more
    vi.spyOn(console, "error").mockImplementation(() => {});
    const mailer = createMailer({ ...base, NODE_ENV: "production", SMTP_HOST: "127.0.0.1", SMTP_PORT: deadPort, MAIL_FROM: "no-reply@example.com" });
    await expect(mailer.send(message)).rejects.toMatchObject({ status: 502, code: "EMAIL_FAILED" });
  });
});

describe("without SMTP settings", () => {
  it("prints the message in the console during development, so sign-up can be tried", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const mailer = createMailer({ ...base, NODE_ENV: "development" });
    expect(mailer.configured).toBe(false);
    await mailer.send(message);
    expect(log).toHaveBeenCalledOnce();
    expect(String(log.mock.calls[0]?.[0])).toContain("482915");
    expect(String(log.mock.calls[0]?.[0])).toContain("shopper@example.com");
  });

  it("refuses in production rather than pretending to send", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const mailer = createMailer({ ...base, NODE_ENV: "production" });
    expect(mailer.configured).toBe(false);
    await expect(mailer.send(message)).rejects.toMatchObject({ status: 503, code: "EMAIL_NOT_CONFIGURED" });
    expect(log).not.toHaveBeenCalled(); // and never prints a code to a production log
  });

  it("needs both a host and a From address to count as set up", () => {
    expect(createMailer({ ...base, NODE_ENV: "production", SMTP_HOST: "smtp.example.com" }).configured).toBe(false);
    expect(createMailer({ ...base, NODE_ENV: "production", MAIL_FROM: "a@b.co" }).configured).toBe(false);
    expect(createMailer({ ...base, NODE_ENV: "production", SMTP_HOST: "smtp.example.com", MAIL_FROM: "a@b.co" }).configured).toBe(true);
  });
});

describe("SMTP settings", () => {
  const minimal = { MONGODB_URI: "mongodb://localhost/x", JWT_SECRET: "x".repeat(32) };

  it("default to port 587, no TLS-from-the-start, and nothing set", () => {
    const env = loadEnv(minimal);
    expect(env).toMatchObject({ SMTP_PORT: 587, SMTP_SECURE: false });
    expect(env.SMTP_HOST).toBeUndefined();
    expect(env.MAIL_FROM).toBeUndefined();
  });

  it("read the usual values, treating empty lines as unset", () => {
    const env = loadEnv({ ...minimal, SMTP_HOST: "smtp.example.com", SMTP_PORT: "465", SMTP_SECURE: "true", SMTP_USER: "", SMTP_PASS: "", MAIL_FROM: "Bhumi <no-reply@example.com>" });
    expect(env).toMatchObject({ SMTP_HOST: "smtp.example.com", SMTP_PORT: 465, SMTP_SECURE: true, MAIL_FROM: "Bhumi <no-reply@example.com>" });
    expect(env.SMTP_USER).toBeUndefined();
    expect(() => loadEnv({ ...minimal, SMTP_SECURE: "maybe" })).toThrow(/SMTP_SECURE/);
    expect(() => loadEnv({ ...minimal, SMTP_PORT: "abc" })).toThrow(/SMTP_PORT/);
  });
});
