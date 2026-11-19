import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import type { Env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";
import { publicOrder, type OrderDoc } from "../lib/serialize.js";
import { parse } from "../lib/validation.js";
import { requireCustomer } from "../middleware/auth.js";
import { createLimiter } from "../middleware/rateLimit.js";
import { Order } from "../models/Order.js";
import { silentOrderNotifier, type NewOrderNotifier } from "../services/orderNotifications.js";
import { checkoutParams, markOrderPaid, placeOrder, placeOrderSchema, tokenMatches } from "../services/orders.js";
import type { PaymentGateway } from "../services/payments.js";
import { silentNotifier, type StorefrontNotifier } from "../services/storefront.js";

// The shopper's side of an order. Only a logged-in customer can place one (there is
// no guest checkout), and it lands in their account. The pay / cancel / look-at-it
// calls below are reached with the order's number plus the secret `X-Order-Token`
// returned when it was placed. A wrong token looks exactly like "no such order".

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(1).max(200),
});

export function orderRoutes({
  env,
  gateway,
  notifier = silentNotifier,
  onPlaced = silentOrderNotifier,
}: {
  env: Env;
  gateway: PaymentGateway;
  notifier?: StorefrontNotifier;
  /** Tells the shop owner a new order has come in (the "New order" email). */
  onPlaced?: NewOrderNotifier;
}): Router {
  const router = Router();
  const placeLimiter = createLimiter(env, { windowMinutes: 60, max: 30, message: "Too many orders from this connection. Please try again later." });
  const guessLimiter = createLimiter(env, { windowMinutes: 15, max: 120, message: "Too many attempts. Please try again later." });

  async function loadOrder(req: Request) {
    const number = Number(req.params.number);
    const token = req.get("x-order-token") ?? "";
    const order = Number.isInteger(number) ? await Order.findOne({ number }).select("+accessTokenHash") : null;
    if (!order || !token || !tokenMatches(token, order.accessTokenHash)) {
      throw HttpError.notFound("Order not found.", "ORDER_NOT_FOUND");
    }
    return order;
  }

  // POST /api/orders — place an order from the cart; returns what Razorpay's popup needs
  // (`payment: null` while Razorpay isn't set up: the order is placed as "pending payment").
  // Needs a logged-in shopper (Authorization: Bearer <customer token>); without one the answer is 401.
  router.post("/orders", placeLimiter, requireCustomer(env), async (req, res) => {
    const input = parse(placeOrderSchema, req.body);
    const { order, token, payment } = await placeOrder(input, gateway, res.locals.customerId);
    res.status(201).json({ order: publicOrder(order), accessToken: token, payment });
  });

  router.get("/orders/:number", guessLimiter, async (req, res) => {
    const order = await loadOrder(req);
    res.json({ order: publicOrder(order.toObject() as unknown as OrderDoc) });
  });

  // POST /api/orders/:number/payment — the Razorpay popup details again (page reloaded, or "Pay Now" pressed later).
  router.post("/orders/:number/payment", guessLimiter, async (req, res) => {
    const order = await loadOrder(req);
    if (order.paymentStatus !== "pending" || order.fulfilmentStatus === "cancelled" || !order.payment?.razorpayOrderId) {
      throw HttpError.conflict("This order can't be paid for.", "ORDER_NOT_PAYABLE");
    }
    res.json({ payment: checkoutParams(order.toObject() as unknown as OrderDoc, gateway) });
  });

  // POST /api/orders/:number/verify-payment — called with what Razorpay's popup returns after paying.
  router.post("/orders/:number/verify-payment", guessLimiter, async (req, res) => {
    const body = parse(verifySchema, req.body);
    const order = await loadOrder(req);

    if (order.payment?.razorpayOrderId !== body.razorpay_order_id) {
      throw HttpError.badRequest("This payment belongs to a different order.", undefined, "PAYMENT_MISMATCH");
    }
    const genuine = gateway.verifyPaymentSignature({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });
    if (!genuine) throw HttpError.badRequest("We couldn't verify this payment.", undefined, "INVALID_SIGNATURE");

    const { order: paid, changed } = await markOrderPaid(order._id, body.razorpay_payment_id);
    if (changed) {
      // paying takes stock off the shelf, which the shop shows
      notifier.revalidate(["catalog"]);
      await onPlaced(paid);
    }
    res.json({ order: publicOrder(paid) });
  });

  // POST /api/orders/:number/confirm — "Pay Now" while online payment isn't set up: there is nothing to
  // pay yet, so this is the moment the shopper has really placed the order. It tells the shop owner (the
  // "New order" email, once per order). With Razorpay set up an order is placed by paying for it instead.
  router.post("/orders/:number/confirm", guessLimiter, async (req, res) => {
    const order = await loadOrder(req);
    if (order.payment?.razorpayOrderId) {
      throw HttpError.conflict("This order is paid for online, so it is placed when the payment goes through.", "ORDER_NEEDS_PAYMENT");
    }
    if (order.paymentStatus !== "pending" || order.fulfilmentStatus === "cancelled") {
      throw HttpError.conflict("This order can't be confirmed.", "ORDER_NOT_CONFIRMABLE");
    }
    await onPlaced(order.toObject() as unknown as OrderDoc);
    res.json({ order: publicOrder(order.toObject() as unknown as OrderDoc) });
  });

  // POST /api/orders/:number/cancel — the "Cancel" button on the pay step. Only before payment.
  router.post("/orders/:number/cancel", guessLimiter, async (req, res) => {
    const order = await loadOrder(req);
    if (order.paymentStatus !== "pending") {
      throw HttpError.conflict("This order has already been paid, so it can't be cancelled here.", "ORDER_NOT_CANCELLABLE");
    }
    if (order.fulfilmentStatus !== "cancelled") {
      order.fulfilmentStatus = "cancelled";
      await order.save();
    }
    res.json({ order: publicOrder(order.toObject() as unknown as OrderDoc) });
  });

  return router;
}
