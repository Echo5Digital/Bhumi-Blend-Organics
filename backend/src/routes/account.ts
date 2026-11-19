import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import type { Env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";
import { publicCustomer, publicOrder, type CustomerDoc, type OrderDoc } from "../lib/serialize.js";
import { addressSchema, emailSchema, paginationSchema, parse } from "../lib/validation.js";
import { requireCustomer, signCustomerToken } from "../middleware/auth.js";
import { createLimiter } from "../middleware/rateLimit.js";
import { Customer } from "../models/Customer.js";
import { Order } from "../models/Order.js";
import type { Mailer } from "../services/mailer.js";
import { OTP_LENGTH, resendCode, startRegistration, verifyCode } from "../services/registration.js";

// Shopper accounts: register (with an emailed one-time code), log in, edit
// details, keep an address book, see past orders. An account is needed to buy:
// checkout (POST /api/orders) requires a login and the order joins that account.
//
// Orders without an account (only possible for any imported from the old shop) are
// NOT matched to an account by email, even though the email is verified.

const name = (label: string) => z.string().trim().min(1, `Please enter your ${label}.`).max(60);
// 72 is bcrypt's limit: anything longer is silently ignored by the hash.
const password = z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters at most.");

const registerSchema = z.object({
  firstName: name("first name"),
  lastName: name("last name"),
  email: emailSchema,
  password,
});

const codeSchema = z.string().trim().regex(new RegExp("^\\d{" + OTP_LENGTH + "}$"), "Enter the " + OTP_LENGTH + "-digit code.");
const verifySchema = z.object({ email: emailSchema, code: codeSchema });
const resendSchema = z.object({ email: emailSchema });

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254),
  password: z.string().min(1).max(200),
});

const updateSchema = z
  .object({
    firstName: name("first name"),
    lastName: name("last name"),
    email: emailSchema,
    currentPassword: z.string().max(200),
    newPassword: password,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to change.");

const kindSchema = z.enum(["shipping", "billing"]);

// A real-looking hash to compare against when the email is unknown, so "no such
// account" and "wrong password" take the same time and can't be told apart.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const emailTaken = () =>
  HttpError.conflict("An account with this email already exists. Please log in instead.", "EMAIL_TAKEN");
const isDuplicateKey = (error: unknown) => (error as { code?: number }).code === 11000;

export function accountRoutes({ env, mailer }: { env: Env; mailer: Mailer }): Router {
  const router = Router();
  const registerLimiter = createLimiter(env, { windowMinutes: 60, max: 10, message: "Too many sign-ups from this connection. Please try again later." });
  const verifyLimiter = createLimiter(env, { windowMinutes: 15, max: 20, message: "Too many attempts. Please wait a few minutes." });
  const resendLimiter = createLimiter(env, { windowMinutes: 60, max: 10, message: "Too many codes requested from this connection. Please try again later." });
  const loginLimiter = createLimiter(env, { windowMinutes: 15, max: 10, message: "Too many login attempts. Please wait a few minutes." });
  const needLogin = requireCustomer(env);

  // Step 1: check the details and email a 6-digit code. No account exists yet.
  router.post("/register", registerLimiter, async (req, res) => {
    const input = parse(registerSchema, req.body);
    const sent = await startRegistration(input, { env, mailer });
    res.status(202).json({ status: "verification_sent", ...sent });
  });

  // Step 2: the right code creates the account and logs the shopper in.
  router.post("/register/verify", verifyLimiter, async (req, res) => {
    const { email, code } = parse(verifySchema, req.body);
    const customer = await verifyCode(email, code, { env });
    res.status(201).json({
      token: signCustomerToken(env, String(customer._id)),
      customer: publicCustomer(customer.toObject() as unknown as CustomerDoc),
    });
  });

  // A fresh code for a sign-up that is waiting (30 seconds apart, five at most).
  router.post("/register/resend", resendLimiter, async (req, res) => {
    const { email } = parse(resendSchema, req.body);
    const sent = await resendCode(email, { env, mailer });
    res.json({ status: "verification_sent", ...sent });
  });

  router.post("/login", loginLimiter, async (req, res) => {
    const { email, password: attempt } = parse(loginSchema, req.body);
    const customer = await Customer.findOne({ email }).select("+passwordHash");
    const ok = await bcrypt.compare(attempt, customer?.passwordHash ?? DUMMY_HASH);
    if (!customer || !customer.isActive || !ok) {
      throw HttpError.unauthorized("Wrong email or password.", "INVALID_CREDENTIALS");
    }
    customer.lastLoginAt = new Date();
    await customer.save();
    res.json({
      token: signCustomerToken(env, String(customer._id)),
      customer: publicCustomer(customer.toObject() as unknown as CustomerDoc),
    });
  });

  // Everything below needs a logged-in shopper.

  const load = async (id: string) => {
    const customer = await Customer.findById(id);
    if (!customer) throw HttpError.unauthorized("Your session has expired. Please log in again.", "TOKEN_INVALID");
    return customer;
  };
  const view = (customer: { toObject(): unknown }) => ({ customer: publicCustomer(customer.toObject() as CustomerDoc) });

  router.get("/me", needLogin, async (_req, res) => {
    res.json(view(await load(res.locals.customerId)));
  });

  // Changing the email or the password needs the current password, so a borrowed
  // phone or an open browser can't be used to take the account over.
  router.patch("/me", needLogin, async (req, res) => {
    const data = parse(updateSchema, req.body);
    const customer = await Customer.findById(res.locals.customerId).select("+passwordHash");
    if (!customer) throw HttpError.unauthorized("Your session has expired. Please log in again.", "TOKEN_INVALID");

    const changingEmail = data.email !== undefined && data.email !== customer.email;
    if (changingEmail || data.newPassword !== undefined) {
      const ok = data.currentPassword ? await bcrypt.compare(data.currentPassword, customer.passwordHash) : false;
      if (!ok) {
        throw HttpError.badRequest(
          "Your current password is incorrect.",
          [{ path: "currentPassword", message: "Your current password is incorrect." }],
          "INVALID_CURRENT_PASSWORD",
        );
      }
    }

    if (data.firstName !== undefined) customer.firstName = data.firstName;
    if (data.lastName !== undefined) customer.lastName = data.lastName;
    if (changingEmail) customer.email = data.email!;
    if (data.newPassword !== undefined) customer.passwordHash = await bcrypt.hash(data.newPassword, 12);
    try {
      await customer.save();
    } catch (error) {
      if (isDuplicateKey(error)) throw emailTaken();
      throw error;
    }
    res.json(view(customer));
  });

  router.put("/addresses/:kind", needLogin, async (req, res) => {
    const kind = parse(kindSchema, req.params.kind);
    const address = parse(addressSchema, req.body);
    const customer = await load(res.locals.customerId);
    customer.set(`addresses.${kind}`, address);
    await customer.save();
    res.json(view(customer));
  });

  router.get("/orders", needLogin, async (req, res) => {
    const query = parse(paginationSchema, req.query);
    // An order the shopper cancelled before paying was never really an order: leave it out.
    const filter: Record<string, unknown> = {
      customer: res.locals.customerId,
      $nor: [{ paymentStatus: "pending", fulfilmentStatus: "cancelled" }],
    };
    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      Order.countDocuments(filter),
    ]);
    res.json({
      items: (items as unknown as OrderDoc[]).map(publicOrder),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.max(1, Math.ceil(total / query.limit)),
    });
  });

  router.get("/orders/:number", needLogin, async (req, res) => {
    const number = Number(req.params.number);
    const order = Number.isInteger(number) ? await Order.findOne({ number, customer: res.locals.customerId }).lean() : null;
    if (!order) throw HttpError.notFound("Order not found.", "ORDER_NOT_FOUND");
    res.json({ order: publicOrder(order as unknown as OrderDoc) });
  });

  return router;
}
