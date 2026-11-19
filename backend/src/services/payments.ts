import crypto from "node:crypto";
import type { Env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";

// Razorpay, behind a small interface so the rest of the app (and the tests)
// never touch the network. The real one talks to Razorpay's REST API with the
// key id + secret; until those are in `.env`, `configured` is false: orders are
// still placed (as "pending payment", see services/orders.ts) but nothing can be
// paid for, and creating a Razorpay order answers 503 "payments not set up".

export type GatewayOrder = { id: string; amount: number; currency: string };

export interface PaymentGateway {
  readonly configured: boolean;
  /** Public key id the browser needs to open the Razorpay popup. */
  readonly keyId: string | undefined;
  createOrder(input: {
    amountPaise: number;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<GatewayOrder>;
  /** Checks the signature the popup returns after a payment (proves it was really paid). */
  verifyPaymentSignature(input: { orderId: string; paymentId: string; signature: string }): boolean;
  /** Checks that a webhook call really came from Razorpay. */
  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

const hmacHex = (secret: string, payload: string | Buffer) =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");

export function createRazorpayGateway(
  env: Pick<Env, "RAZORPAY_KEY_ID" | "RAZORPAY_KEY_SECRET" | "RAZORPAY_WEBHOOK_SECRET">,
): PaymentGateway {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

  return {
    configured: Boolean(keyId && keySecret),
    keyId,

    async createOrder({ amountPaise, receipt, notes }) {
      if (!keyId || !keySecret) {
        throw HttpError.unavailable("Online payments are not set up yet.", "PAYMENTS_NOT_CONFIGURED");
      }
      let response: Response;
      try {
        response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
          },
          body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }),
          signal: AbortSignal.timeout(15_000),
        });
      } catch {
        throw new HttpError(502, "PAYMENT_GATEWAY_ERROR", "Could not reach the payment provider. Please try again.");
      }
      if (!response.ok) {
        // Razorpay's reason can mention account details, so it goes to the log, not the shopper.
        console.error("Razorpay order creation failed:", response.status, await response.text().catch(() => ""));
        throw new HttpError(502, "PAYMENT_GATEWAY_ERROR", "The payment provider could not start this payment. Please try again.");
      }
      const body = (await response.json()) as { id: string; amount: number; currency: string };
      return { id: body.id, amount: body.amount, currency: body.currency };
    },

    verifyPaymentSignature({ orderId, paymentId, signature }) {
      if (!keySecret) return false;
      return safeEqual(hmacHex(keySecret, `${orderId}|${paymentId}`), signature);
    },

    verifyWebhookSignature(rawBody, signature) {
      if (!webhookSecret || !signature) return false;
      return safeEqual(hmacHex(webhookSecret, rawBody), signature);
    },
  };
}
