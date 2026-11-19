import crypto from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadEnv, type Env } from "../src/config/env.js";
import { signCustomerToken } from "../src/middleware/auth.js";
import { Customer } from "../src/models/Customer.js";
import { Order } from "../src/models/Order.js";
import { createRazorpayGateway, type PaymentGateway } from "../src/services/payments.js";
import { HttpError } from "../src/lib/httpError.js";
import type { ImageStore } from "../src/services/images.js";
import type { MailMessage, Mailer } from "../src/services/mailer.js";
import type { StorefrontNotifier, StorefrontTag } from "../src/services/storefront.js";
import { upsertAdmin } from "../scripts/lib/admin.js";
import { seedCatalogue } from "../scripts/lib/seed-catalogue.js";

export const KEY_SECRET = "test_key_secret";
export const WEBHOOK_SECRET = "test_webhook_secret";

/** Real signature checking (so those tests mean something), but no network: order creation is faked. */
export function fakeGateway(options: { configured?: boolean; failCreate?: boolean } = {}) {
  const real = createRazorpayGateway({
    RAZORPAY_KEY_ID: options.configured === false ? undefined : "rzp_test_key",
    RAZORPAY_KEY_SECRET: options.configured === false ? undefined : KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
  });
  const created: { id: string; amountPaise: number; receipt: string }[] = [];
  const gateway: PaymentGateway = {
    ...real,
    async createOrder({ amountPaise, receipt }) {
      if (options.failCreate) throw new Error("gateway down");
      const id = `order_test_${created.length + 1}`;
      created.push({ id, amountPaise, receipt });
      return { id, amount: amountPaise, currency: "INR" };
    },
  };
  return { gateway, created };
}

export function fakeImages() {
  const removed: string[] = [];
  const uploaded: number[] = [];
  const images: ImageStore = {
    configured: true,
    async upload(file) {
      uploaded.push(file.length);
      return { url: "https://res.cloudinary.com/test/image/upload/bhumiblend/new-photo.jpg", publicId: "bhumiblend/new-photo", width: 800, height: 600 };
    },
    async uploadFile() {
      throw new Error("not used in tests");
    },
    async remove(publicId) {
      removed.push(publicId);
    },
  };
  return { images, removed, uploaded };
}

/** Records the emails instead of sending them. `failNext()` makes the next send fail, like an SMTP outage. */
export function fakeMailer() {
  const outbox: MailMessage[] = [];
  let failing = false;
  const mailer: Mailer = {
    configured: true,
    async send(message) {
      if (failing) {
        failing = false;
        throw new HttpError(502, "EMAIL_FAILED", "We couldn't send the email just now. Please try again in a moment.");
      }
      outbox.push(message);
    },
  };
  return {
    mailer,
    outbox,
    failNext: () => {
      failing = true;
    },
    /** The 6-digit code in the most recent email. */
    lastCode: () => outbox.at(-1)?.text.match(/\b(\d{6})\b/)?.[1] ?? "",
  };
}

/** Records which parts of the storefront the backend asked to refresh (one entry per request). */
export function fakeNotifier() {
  const calls: StorefrontTag[][] = [];
  const notifier: StorefrontNotifier = {
    revalidate(tags) {
      calls.push([...tags]);
    },
  };
  return { notifier, calls };
}

/** A whole app on its own empty in-memory MongoDB, with the catalogue loaded. */
export async function startTestApp(
  options: { payments?: PaymentGateway; images?: ImageStore; mailer?: Mailer; notifier?: StorefrontNotifier; seed?: boolean; env?: Record<string, string> } = {},
) {
  const mongo = await MongoMemoryServer.create();
  const env = loadEnv({
    NODE_ENV: "test",
    MONGODB_URI: mongo.getUri("bhumiblend-test"),
    JWT_SECRET: "test-secret-test-secret-test-secret-test-secret",
    CLIENT_ORIGINS: "http://localhost:3000",
    ...options.env,
  });
  await mongoose.connect(env.MONGODB_URI);
  if (options.seed !== false) await seedCatalogue();

  const app = createApp({ env, payments: options.payments, images: options.images, mailer: options.mailer ?? fakeMailer().mailer, notifier: options.notifier });
  return {
    app,
    api: request(app),
    env,
    async stop() {
      await mongoose.disconnect();
      await mongo.stop();
    },
  };
}

/** Log in as a (freshly created) admin and return the header to send. */
export async function adminHeader(api: ReturnType<typeof request>) {
  const login = { email: "boss@example.com", password: "a-long-test-password" };
  await upsertAdmin({ ...login, name: "Boss" });
  const response = await api.post("/api/admin/auth/login").send(login);
  return { Authorization: `Bearer ${response.body.token as string}` };
}

/**
 * A logged-in shopper's header (the shopper is created on the spot, once per email). Placing an
 * order needs one: there is no guest checkout.
 */
export async function customerHeader(ctx: { env: Env }, email = "shopper@example.com") {
  const customer = await Customer.findOneAndUpdate(
    { email },
    { $setOnInsert: { email, firstName: "Test", lastName: "Shopper", passwordHash: "not-a-real-hash" } },
    { upsert: true, returnDocument: "after" },
  );
  return { Authorization: `Bearer ${signCustomerToken(ctx.env, String(customer._id))}` };
}

/**
 * An order with no account on it, like one imported from the old shop (the admin's customer
 * list and reports still handle those). The API no longer takes guest orders, so this places it
 * as a throwaway shopper, then detaches the order and removes the shopper.
 */
export async function placeOrderWithoutAccount(ctx: { api: ReturnType<typeof request>; env: Env }, payload: object) {
  const email = `throwaway-${crypto.randomUUID()}@example.com`;
  const response = await ctx.api.post("/api/orders").set(await customerHeader(ctx, email)).send(payload);
  if (response.status === 201) await Order.collection.updateOne({ number: response.body.order.number }, { $unset: { customer: "" } });
  await Customer.deleteOne({ email });
  return response;
}

/** What Razorpay's popup returns after a real payment. */
export function paymentSignature(razorpayOrderId: string, paymentId: string) {
  return crypto.createHmac("sha256", KEY_SECRET).update(`${razorpayOrderId}|${paymentId}`).digest("hex");
}

export function webhookSignature(rawBody: string) {
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
}

export const validAddress = {
  firstName: "Asha",
  lastName: "Nair",
  line1: "12 Temple Road",
  city: "Kochi",
  state: "Kerala",
  pin: "682001",
  phone: "98765 43210",
};
