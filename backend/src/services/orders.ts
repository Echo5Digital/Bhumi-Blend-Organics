import crypto from "node:crypto";
import { z } from "zod";
import { HttpError } from "../lib/httpError.js";
import { fromPaise, toPaise } from "../lib/money.js";
import type { OrderDoc } from "../lib/serialize.js";
import { addressSchema, emailSchema } from "../lib/validation.js";
import { Coupon } from "../models/Coupon.js";
import { nextSequence } from "../models/Counter.js";
import { Order } from "../models/Order.js";
import type { PaymentGateway } from "./payments.js";
import { cartItemsSchema, evaluateCoupon, priceCart } from "./pricing.js";
import { reduceStock } from "./stock.js";

/**
 * The first order is number 20001. The old WooCommerce shop had already reached
 * about 15900, so starting higher keeps new numbers from clashing with old ones.
 * (Only matters for a fresh database; the counter carries on from where it is.)
 */
const ORDER_NUMBER_START = 20000;

export const placeOrderSchema = z.object({
  items: cartItemsSchema,
  email: emailSchema,
  shipping: addressSchema,
  billingSameAsShipping: z.boolean().default(true),
  billing: addressSchema.optional(),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value || undefined),
  couponCode: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((value) => value || undefined),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

// ---- order access token ---------------------------------------------------
// Each order gets a random secret, returned once when it is placed. Looking at,
// paying for or cancelling the order through the checkout calls needs it; only its
// hash is stored.

export const newAccessToken = () => crypto.randomBytes(24).toString("base64url");
export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export function tokenMatches(token: string, hash: string): boolean {
  const left = Buffer.from(hashToken(token));
  const right = Buffer.from(hash);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

// ---- placing an order -----------------------------------------------------

/** What the browser needs to open the Razorpay popup for an order. */
export function checkoutParams(order: OrderDoc, gateway: PaymentGateway) {
  return {
    provider: "razorpay" as const,
    keyId: gateway.keyId,
    razorpayOrderId: order.payment?.razorpayOrderId,
    amountPaise: toPaise(order.total),
    currency: order.currency,
    name: "Bhumi Blend Organics",
    description: `Order #${order.number}`,
    prefill: {
      name: `${order.shipping.firstName} ${order.shipping.lastName}`,
      email: order.email,
      contact: order.shipping.phone,
    },
  };
}

/**
 * Place an order from the cart.
 *
 * With Razorpay set up, the order is created together with a Razorpay order and the shopper pays in
 * the popup (`payment` holds what it needs). Without Razorpay keys the order is still placed, as
 * "pending payment" with `payment: null`: the shopper gets an order number and the admin sees it,
 * but nothing can be paid for yet, so stock and coupons are untouched (they move when it is paid)
 * and the admin can only cancel it, like any other unpaid order.
 */
export async function placeOrder(input: PlaceOrderInput, gateway: PaymentGateway, customerId: string) {
  if (!input.billingSameAsShipping && !input.billing) {
    throw HttpError.badRequest("Please enter a billing address.", [{ path: "billing", message: "Billing address is required." }], "VALIDATION_ERROR");
  }

  const cart = await priceCart(input.items);
  const coupon = input.couponCode ? await evaluateCoupon(input.couponCode, cart.subtotal) : undefined;

  const discountPaise = toPaise(coupon?.discount ?? 0);
  const shippingPaise = 0; // free shipping on every order, as on the live site
  const totalPaise = toPaise(cart.subtotal) - discountPaise + shippingPaise;
  // Razorpay can't charge less than ₹1, so a coupon that wipes out the whole order isn't accepted.
  if (totalPaise < 100) {
    throw HttpError.badRequest("The order total must be at least ₹1.00.", undefined, "TOTAL_TOO_LOW");
  }

  const number = await nextSequence("order", ORDER_NUMBER_START);
  const token = newAccessToken();

  const order = await Order.create({
    number,
    accessTokenHash: hashToken(token),
    customer: customerId,
    email: input.email,
    items: cart.lines,
    shipping: input.shipping,
    billing: input.billingSameAsShipping ? input.shipping : input.billing,
    billingSameAsShipping: input.billingSameAsShipping,
    note: input.note,
    coupon: coupon ? { code: coupon.code, discount: coupon.discount } : undefined,
    subtotal: cart.subtotal,
    discountTotal: fromPaise(discountPaise),
    shippingTotal: fromPaise(shippingPaise),
    total: fromPaise(totalPaise),
    notes: gateway.configured
      ? []
      : [{ text: "Order placed without online payment (Razorpay isn't connected yet). Payment is still pending.", author: "System", customerNote: false }],
  });

  if (gateway.configured) {
    try {
      const gatewayOrder = await gateway.createOrder({
        amountPaise: totalPaise,
        receipt: `BB-${number}`,
        notes: { orderNumber: String(number) },
      });
      order.set("payment.razorpayOrderId", gatewayOrder.id);
      await order.save();
    } catch (error) {
      // No payment can ever be made for this order, so don't leave it looking open.
      await Order.updateOne({ _id: order._id }, { $set: { fulfilmentStatus: "cancelled" } });
      throw error;
    }
  }

  const saved = order.toObject() as unknown as OrderDoc;
  return { order: saved, token, payment: gateway.configured ? checkoutParams(saved, gateway) : null };
}

// ---- recording a payment --------------------------------------------------

/**
 * Mark an order paid. Safe to call twice for the same payment (the browser's
 * "verify" call and Razorpay's webhook usually both arrive): only the first one
 * changes anything, so a coupon is counted once.
 */
export async function markOrderPaid(orderId: unknown, paymentId: string) {
  const paid = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: "pending" },
    {
      $set: {
        paymentStatus: "paid",
        "payment.razorpayPaymentId": paymentId,
        "payment.paidAt": new Date(),
        stockReduced: true,
      },
      $unset: { "payment.lastError": "" },
      $push: { notes: { text: `Payment received through Razorpay (${paymentId}).`, author: "System", customerNote: false, createdAt: new Date() } },
    },
    { returnDocument: "after" },
  );

  if (!paid) {
    // Already paid (or refunded): nothing to do, hand back the order as it is.
    const existing = await Order.findById(orderId);
    if (!existing) throw HttpError.notFound("Order not found.", "ORDER_NOT_FOUND");
    return { order: existing.toObject() as unknown as OrderDoc, changed: false };
  }

  // Paid after the shopper pressed Cancel: put it back in front of the admin.
  if (paid.fulfilmentStatus === "cancelled") {
    paid.fulfilmentStatus = "new";
    await paid.save();
  }
  if (paid.coupon?.code) await Coupon.updateOne({ code: paid.coupon.code }, { $inc: { usedCount: 1 } });
  await reduceStock(paid.items);

  return { order: paid.toObject() as unknown as OrderDoc, changed: true };
}
