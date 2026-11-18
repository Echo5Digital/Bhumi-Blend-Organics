import type { Request, RequestHandler } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";
import { AdminUser } from "../models/AdminUser.js";
import { Customer } from "../models/Customer.js";

// Logging in (admin panel or customer account) gives a signed token (JWT) that
// is sent as `Authorization: Bearer <token>`. The token only says "this is
// admin/customer <id>"; the user is looked up on every request, so switching
// someone off takes effect immediately. Admin and customer tokens carry a
// different `role`, so one can never be used on the other's routes.

type Role = "admin" | "customer";

function sign(secret: string, expiresIn: string, role: Role, id: string) {
  return jwt.sign({ role }, secret, { subject: id, expiresIn: expiresIn as SignOptions["expiresIn"] });
}

export const signAdminToken = (env: Pick<Env, "JWT_SECRET" | "JWT_EXPIRES_IN">, adminId: string) =>
  sign(env.JWT_SECRET, env.JWT_EXPIRES_IN, "admin", adminId);

export const signCustomerToken = (env: Pick<Env, "JWT_SECRET" | "CUSTOMER_JWT_EXPIRES_IN">, customerId: string) =>
  sign(env.JWT_SECRET, env.CUSTOMER_JWT_EXPIRES_IN, "customer", customerId);

const bearerToken = (req: Request) => {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
};

/** The user id inside a valid token for `role`, or null (bad signature, expired, wrong role...). */
function subjectOf(secret: string, token: string, role: Role): string | null {
  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload === "string" || payload.role !== role || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

const sessionExpired = () => HttpError.unauthorized("Your session has expired. Please log in again.", "TOKEN_INVALID");

export function requireAdmin(env: Pick<Env, "JWT_SECRET">): RequestHandler {
  return async (req, res, next) => {
    const token = bearerToken(req);
    if (!token) throw HttpError.unauthorized("Please log in.");

    const adminId = subjectOf(env.JWT_SECRET, token, "admin");
    const admin = adminId ? await AdminUser.findById(adminId) : null;
    if (!admin || !admin.isActive) throw sessionExpired();

    res.locals.admin = { id: String(admin._id), email: admin.email, name: admin.name };
    next();
  };
}

/** Routes for a logged-in shopper: puts the customer's id in `res.locals.customerId`. */
export function requireCustomer(env: Pick<Env, "JWT_SECRET">): RequestHandler {
  return async (req, res, next) => {
    const token = bearerToken(req);
    if (!token) throw HttpError.unauthorized("Please log in.");

    const customerId = subjectOf(env.JWT_SECRET, token, "customer");
    const customer = customerId ? await Customer.findById(customerId).select("_id isActive") : null;
    if (!customer || !customer.isActive) throw sessionExpired();

    res.locals.customerId = String(customer._id);
    next();
  };
}

/**
 * For routes open to everyone (checkout): if the shopper happens to be logged
 * in, `res.locals.customerId` is set so the order lands in their account;
 * otherwise (no token, or a stale one) it carries on as a guest.
 */
export function optionalCustomer(env: Pick<Env, "JWT_SECRET">): RequestHandler {
  return async (req, res, next) => {
    const token = bearerToken(req);
    const customerId = token ? subjectOf(env.JWT_SECRET, token, "customer") : null;
    if (customerId) {
      const customer = await Customer.findById(customerId).select("_id isActive");
      if (customer?.isActive) res.locals.customerId = String(customer._id);
    }
    next();
  };
}
