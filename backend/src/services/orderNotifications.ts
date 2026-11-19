import type { Env } from "../config/env.js";
import type { OrderDoc } from "../lib/serialize.js";
import { Order } from "../models/Order.js";
import { getSettings } from "../models/Setting.js";
import { loadCustomerOrderEmail, renderCustomerOrderEmail } from "./customerOrderEmail.js";
import type { RenderedEmail } from "./emailParts.js";
import type { Mailer } from "./mailer.js";
import { loadNewOrderEmail, parseRecipients, renderNewOrderEmail, type EmailOrder, type NewOrderEmailSettings, type RenderContext } from "./newOrderEmail.js";

/** Called when an order is really placed (paid, or confirmed by the shopper while online payment isn't set up). Never throws. */
export type NewOrderNotifier = (order: OrderDoc) => Promise<void>;

/** For tests and apps that don't send mail. */
export const silentOrderNotifier: NewOrderNotifier = async () => {};

/** An order as the email templates want it. */
export function toEmailOrder(order: OrderDoc): EmailOrder {
  return {
    number: order.number,
    createdAt: order.createdAt ?? new Date(),
    email: order.email,
    items: order.items.map((item) => ({ name: item.name, size: item.size, qty: item.qty, unitPrice: item.unitPrice, lineTotal: item.lineTotal, image: item.image })),
    shipping: order.shipping,
    billing: order.billing,
    billingSameAsShipping: order.billingSameAsShipping ?? true,
    note: order.note,
    coupon: order.coupon,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal ?? 0,
    shippingTotal: order.shippingTotal ?? 0,
    total: order.total,
    paymentStatus: order.paymentStatus ?? "pending",
  };
}

const addNote = (orderId: unknown, text: string) =>
  Order.updateOne({ _id: orderId }, { $push: { notes: { text, author: "System", customerNote: false, createdAt: new Date() } } });

type Delivery = {
  /** Which "already sent" marker on the order this email uses. */
  flag: "newOrderEmailSentAt" | "customerEmailSentAt";
  /** What to call it in the order's notes. */
  name: string;
  settings: NewOrderEmailSettings;
  to: string[];
  render: () => Promise<RenderedEmail>;
};

/**
 * Sends one email for one order, once. A problem with it (no SMTP, a refused address) is written on the
 * order as a note and logged, and never reaches the shopper: placing the order has already worked.
 */
async function deliver(order: OrderDoc, mailer: Mailer, { flag, name, settings, to, render }: Delivery) {
  // Claim the order first: if two things call this at once (the browser and Razorpay's webhook), only one sends.
  const claimed = await Order.findOneAndUpdate({ _id: order._id, [flag]: { $exists: false } }, { $set: { [flag]: new Date() } });
  if (!claimed) return;

  const list = to.join(", ");
  try {
    const message = await render();
    await mailer.send({ to: list, subject: message.subject, text: message.text, ...(settings.format === "html" && { html: message.html }) });
    await addNote(order._id, mailer.configured ? `${name} email sent to ${list}.` : `${name} email prepared for ${list}, but email isn't set up on the server yet (SMTP), so it was only printed in the server's log.`);
  } catch (error) {
    // Let a later event (a payment, another confirm) try again, and tell the team why this one didn't go.
    await Order.updateOne({ _id: order._id }, { $unset: { [flag]: "" } });
    await addNote(order._id, `The ${name.toLowerCase()} email could not be sent to ${list}.`);
    console.error(`${name} email for #${order.number} failed:`, error instanceof Error ? error.message : error);
  }
}

/**
 * When an order is placed: the shop owner gets the "New order" email (to the recipients saved in the admin,
 * or ORDER_NOTIFY_EMAILS) and the shopper gets the "Order received" email (to the address they gave at
 * checkout). Each can be switched off in the admin, each goes out once per order, and one failing never
 * stops the other.
 */
export function createNewOrderNotifier({
  env,
  mailer,
}: {
  env: Pick<Env, "ORDER_NOTIFY_EMAILS" | "STOREFRONT_URL">;
  mailer: Mailer;
}): NewOrderNotifier {
  const renderContext = async (): Promise<RenderContext> => {
    const { storeName, contactEmail, contactPhone } = await getSettings();
    return { siteName: storeName, storefrontUrl: env.STOREFRONT_URL?.replace(/\/+$/, ""), contactEmail: contactEmail || undefined, contactPhone: contactPhone || undefined };
  };

  return async (order) => {
    // the shop owner
    try {
      const settings = await loadNewOrderEmail(env);
      const { valid } = parseRecipients(settings.recipients);
      if (settings.enabled && valid.length > 0) {
        await deliver(order, mailer, { flag: "newOrderEmailSentAt", name: "New-order", settings, to: valid, render: async () => renderNewOrderEmail(toEmailOrder(order), settings, await renderContext()) });
      }
    } catch (error) {
      console.error(`New-order email for #${order.number} failed:`, error instanceof Error ? error.message : error);
    }

    // the shopper
    try {
      const settings = await loadCustomerOrderEmail();
      const { valid } = parseRecipients(order.email);
      if (settings.enabled && valid.length > 0) {
        await deliver(order, mailer, { flag: "customerEmailSentAt", name: "Order-received", settings, to: valid, render: async () => renderCustomerOrderEmail(toEmailOrder(order), settings, await renderContext()) });
      }
    } catch (error) {
      console.error(`Order-received email for #${order.number} failed:`, error instanceof Error ? error.message : error);
    }
  };
}
