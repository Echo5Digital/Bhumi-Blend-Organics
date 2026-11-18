import type { RequestHandler } from "express";
import { HttpError } from "../lib/httpError.js";
import { toPaise } from "../lib/money.js";
import { Order } from "../models/Order.js";
import { markOrderPaid } from "../services/orders.js";
import type { PaymentGateway } from "../services/payments.js";
import { silentNotifier, type StorefrontNotifier } from "../services/storefront.js";

// POST /api/webhooks/razorpay
//
// Razorpay calls this when a payment is captured or fails — the safety net for
// a shopper who paid but closed the tab before the browser could confirm. It
// must be mounted with express.raw(): the signature is over the exact bytes.

type RazorpayEvent = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; amount?: number; error_description?: string } };
    order?: { entity?: { id?: string } };
  };
};

export function razorpayWebhook(gateway: PaymentGateway, notifier: StorefrontNotifier = silentNotifier): RequestHandler {
  return async (req, res) => {
    const raw: unknown = req.body;
    if (!Buffer.isBuffer(raw) || !gateway.verifyWebhookSignature(raw, req.get("x-razorpay-signature"))) {
      throw HttpError.badRequest("Invalid signature.", undefined, "INVALID_SIGNATURE");
    }

    let event: RazorpayEvent;
    try {
      event = JSON.parse(raw.toString("utf8")) as RazorpayEvent;
    } catch {
      throw HttpError.badRequest("The body is not valid JSON.", undefined, "INVALID_JSON");
    }

    const payment = event.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id ?? event.payload?.order?.entity?.id;
    const order = razorpayOrderId ? await Order.findOne({ "payment.razorpayOrderId": razorpayOrderId }) : null;

    if (order && payment?.id) {
      if (event.event === "payment.captured" || event.event === "order.paid") {
        // Only accept a payment for the full amount of this order.
        if (payment.amount === toPaise(order.total)) {
          const { changed } = await markOrderPaid(order._id, payment.id);
          if (changed) notifier.revalidate(["catalog"]);
        } else {
          console.error(`Razorpay webhook: amount ${payment.amount} does not match order #${order.number}`);
        }
      } else if (event.event === "payment.failed" && order.paymentStatus === "pending") {
        // The shopper can retry on the same Razorpay order, so only note the reason.
        order.set("payment.lastError", payment.error_description ?? "Payment failed");
        await order.save();
      }
    }

    // 200 even for events we ignore, so Razorpay doesn't keep retrying them.
    res.json({ received: true });
  };
}
