import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import type { Env } from "../config/env.js";

// Brakes on the endpoints people could hammer: guessing admin passwords,
// guessing coupon codes, spamming orders. Counted per IP address (set
// TRUST_PROXY when the API sits behind a proxy so the real address is used).
// Switched off in tests.

export function createLimiter(env: Pick<Env, "NODE_ENV">, options: { windowMinutes: number; max: number; message: string }): RequestHandler {
  if (env.NODE_ENV === "test") return (_req, _res, next) => next();
  return rateLimit({
    windowMs: options.windowMinutes * 60_000,
    limit: options.max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: options.message } },
  });
}
