import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { Env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";
import { Customer } from "../models/Customer.js";
import { PendingRegistration } from "../models/PendingRegistration.js";
import { verificationEmail } from "./emailTemplates.js";
import type { Mailer } from "./mailer.js";

// Sign-up with an emailed one-time code:
//   startRegistration  → stores the sign-up as "pending" and emails a 6-digit code
//   resendCode         → a fresh code for a pending sign-up
//   verifyCode         → right code = the account is created
//
// Limits: a code works for 10 minutes and allows 5 wrong guesses (then the
// sign-up is thrown away); a new code can be requested every 30 seconds, at
// most 5 per sign-up. With a million possible codes, 5 guesses is a 1-in-200,000
// shot, and each guess is counted atomically so parallel requests can't cheat.

export const OTP_LENGTH = 6;
export const OTP_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 30;
export const MAX_ATTEMPTS = 5;
export const MAX_SENDS = 5;
/** How long a pending sign-up is kept at all. */
const PENDING_HOURS = 1;

type Deps = { env: Pick<Env, "JWT_SECRET">; mailer: Mailer };

const generateCode = () => String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

/** Keyed with the server secret and tied to the email, so a code can't be checked offline or reused for another address. */
const hashCode = (secret: string, email: string, code: string) =>
  crypto.createHmac("sha256", secret).update(`${email}:${code}`).digest("hex");

const sameHash = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

const emailTaken = () => HttpError.conflict("An account with this email already exists. Please log in instead.", "EMAIL_TAKEN");

const notFound = () =>
  HttpError.badRequest("This sign-up has expired. Please register again.", undefined, "OTP_NOT_FOUND");

/**
 * What the shopper's screen needs after a code goes out. `delivery` is "console" only when no SMTP is set up in
 * development (the mailer then prints the code in the server's terminal instead of emailing it); in production an
 * unconfigured mailer refuses to send at all, so a real shopper is never told "console".
 */
const timing = (mailer: Mailer) => ({
  expiresInSeconds: OTP_MINUTES * 60,
  resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
  delivery: mailer.configured ? ("email" as const) : ("console" as const),
});

function checkCanSend(pending: { lastSentAt: Date; sendCount: number }, now: Date) {
  const waitSeconds = Math.ceil((pending.lastSentAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000 - now.getTime()) / 1000);
  if (waitSeconds > 0) {
    throw HttpError.tooMany(`Please wait ${waitSeconds} seconds before asking for another code.`, "OTP_COOLDOWN", {
      retryAfterSeconds: waitSeconds,
    });
  }
  if (pending.sendCount >= MAX_SENDS) {
    throw HttpError.tooMany("Too many codes have been sent for this email. Please try again in an hour.", "OTP_SEND_LIMIT");
  }
}

/** Put a fresh code on the pending sign-up and email it. If the email can't be sent, the sign-up is dropped. */
async function issueCode(pending: InstanceType<typeof PendingRegistration>, { env, mailer }: Deps) {
  const now = new Date();
  const code = generateCode();
  pending.otpHash = hashCode(env.JWT_SECRET, pending.email, code);
  pending.otpExpiresAt = new Date(now.getTime() + OTP_MINUTES * 60_000);
  pending.expiresAt = new Date(now.getTime() + PENDING_HOURS * 3_600_000);
  pending.lastSentAt = now;
  pending.attempts = 0;
  pending.sendCount += 1;
  await pending.save();

  try {
    await mailer.send(verificationEmail({ to: pending.email, firstName: pending.firstName, code, minutes: OTP_MINUTES }));
  } catch (error) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    throw error;
  }
}

export async function startRegistration(
  input: { firstName: string; lastName: string; email: string; password: string },
  deps: Deps,
) {
  if (await Customer.exists({ email: input.email })) throw emailTaken();

  const existing = await PendingRegistration.findOne({ email: input.email });
  if (existing) checkCanSend(existing, new Date());

  // Registering again for the same address replaces the earlier attempt (new details, new code).
  const pending =
    existing ??
    new PendingRegistration({ email: input.email, sendCount: 0, attempts: 0 });
  pending.firstName = input.firstName;
  pending.lastName = input.lastName;
  pending.passwordHash = await bcrypt.hash(input.password, 12);
  await issueCode(pending, deps);

  return { email: input.email, ...timing(deps.mailer) };
}

export async function resendCode(email: string, deps: Deps) {
  const pending = await PendingRegistration.findOne({ email });
  if (!pending) throw notFound();
  checkCanSend(pending, new Date());
  await issueCode(pending, deps);
  return { email, ...timing(deps.mailer) };
}

export async function verifyCode(email: string, code: string, { env }: Pick<Deps, "env">) {
  // Count the guess first, atomically — and only while guesses remain.
  const pending = await PendingRegistration.findOneAndUpdate(
    { email, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" },
  ).select("+passwordHash +otpHash");

  if (!pending) {
    if (await PendingRegistration.exists({ email })) {
      // Every guess is used up: the sign-up is dead, start over.
      await PendingRegistration.deleteOne({ email });
      throw HttpError.badRequest("Too many wrong codes. Please register again.", undefined, "OTP_TOO_MANY_ATTEMPTS");
    }
    throw notFound();
  }

  if (pending.otpExpiresAt <= new Date()) {
    throw HttpError.badRequest("That code has expired. Please ask for a new one.", undefined, "OTP_EXPIRED");
  }

  if (!sameHash(hashCode(env.JWT_SECRET, email, code), pending.otpHash)) {
    const left = MAX_ATTEMPTS - pending.attempts;
    if (left <= 0) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      throw HttpError.badRequest("Too many wrong codes. Please register again.", undefined, "OTP_TOO_MANY_ATTEMPTS");
    }
    throw HttpError.badRequest(
      `That code isn't right. You have ${left} ${left === 1 ? "try" : "tries"} left.`,
      { attemptsLeft: left },
      "OTP_INVALID",
    );
  }

  // Right code. Claim the pending sign-up so a second, simultaneous request can't also use it.
  const claimed = await PendingRegistration.deleteOne({ _id: pending._id, otpHash: pending.otpHash });
  if (claimed.deletedCount === 0) throw notFound();

  try {
    return await Customer.create({
      email: pending.email,
      firstName: pending.firstName,
      lastName: pending.lastName,
      passwordHash: pending.passwordHash,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw emailTaken();
    throw error;
  }
}
