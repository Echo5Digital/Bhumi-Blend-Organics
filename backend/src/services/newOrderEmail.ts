import { z } from "zod";
import type { Env } from "../config/env.js";
import { Setting } from "../models/Setting.js";
import { withLogo } from "./emailLogo.js";
import {
  addressBlock,
  addressLines,
  buttonBlock,
  cardsBlock,
  emailDocument,
  esc,
  fill,
  formatDateTime,
  heroBlock,
  itemsBlock,
  money,
  nameOf,
  noteBlock,
  oneLine,
  phoneLink,
  plainOrderLines,
  row,
  statusChips,
  totalBox,
  totalsBlock,
  escLines,
  GOLD_DARK,
  MUTED,
  INK,
  type AddressLike,
  type EmailOrder,
  type RenderContext,
  type RenderedEmail,
} from "./emailParts.js";

// The "New order" email: the message the shop owner gets when an order is placed (Settings →
// Emails → New order in the admin). This file holds its settings and builds the message; sending is
// in orderNotifications.ts. The customer's "Order received" email is in customerOrderEmail.ts; both
// are built from emailParts.ts.

export type { EmailOrder, RenderContext } from "./emailParts.js";

export const DEFAULT_SUBJECT = "[{site_title}]: New order #{order_number}";
export const DEFAULT_HEADING = "New order: #{order_number}";
/** What the admin can type into the subject, heading and extra text. */
export const PLACEHOLDERS = ["{site_title}", "{order_number}", "{order_date}", "{customer_name}"] as const;

export type EmailFormat = "html" | "plain";

export type NewOrderEmailSettings = {
  enabled: boolean;
  /** Comma-separated addresses, as typed in the admin. (The customer's email has none: it goes to the customer.) */
  recipients: string;
  /** Blank = the email's default subject. */
  subject: string;
  /** Blank = the email's default heading. */
  heading: string;
  additionalContent: string;
  format: EmailFormat;
};

// ---- settings --------------------------------------------------------------

const emailCheck = z.email().max(254);

/** Splits "a@b.com, c@d.com; e@f.com" into the good addresses (lower-cased, no repeats) and the bad ones. */
export function parseRecipients(text: string | undefined | null): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const part of (text ?? "").split(/[\s,;]+/).filter(Boolean)) {
    if (!emailCheck.safeParse(part).success) invalid.push(part);
    else if (!valid.includes(part.toLowerCase())) valid.push(part.toLowerCase());
  }
  return { valid, invalid };
}

/** The saved settings; recipients fall back to ORDER_NOTIFY_EMAILS (the default set in .env). */
export async function loadNewOrderEmail(env: Pick<Env, "ORDER_NOTIFY_EMAILS">): Promise<NewOrderEmailSettings> {
  const saved = (await Setting.findById("general").lean())?.newOrderEmail;
  return {
    enabled: saved?.enabled ?? true,
    recipients: saved?.recipients || env.ORDER_NOTIFY_EMAILS || "",
    subject: saved?.subject ?? "",
    heading: saved?.heading ?? "",
    additionalContent: saved?.additionalContent ?? "",
    format: saved?.format ?? "html",
  };
}

/** A made-up order, for the admin's preview and the "send a test email" button. */
export function sampleOrder(): EmailOrder {
  const address: AddressLike = { firstName: "Asha", lastName: "Nair", line1: "12 Temple Road", line2: "Near the library", city: "Kochi", state: "Kerala", pin: "682001", country: "India", phone: "9876543210" };
  return {
    number: 20001,
    createdAt: new Date(),
    email: "asha@example.com",
    items: [
      { name: "Organic Saffron Gel", size: "100g", qty: 1, unitPrice: 599, lineTotal: 599 },
      { name: "Aloe Pure Shampoo", size: "200ml", qty: 2, unitPrice: 599, lineTotal: 1198 },
    ],
    shipping: address,
    billing: address,
    billingSameAsShipping: true,
    note: "Please deliver after 6 pm.",
    coupon: { code: "WELCOME10", discount: 179.7 },
    subtotal: 1797,
    discountTotal: 179.7,
    shippingTotal: 0,
    total: 1617.3,
    paymentStatus: "pending",
  };
}

// ---- building the message ---------------------------------------------------

export function renderNewOrderEmail(order: EmailOrder, settings: NewOrderEmailSettings, shop: RenderContext): RenderedEmail {
  const { context, attachments } = withLogo(shop); // the logo travels inside the email
  const customer = nameOf(order.shipping) || order.email;
  const placedOn = formatDateTime(order.createdAt);
  const vars = { site_title: context.siteName, order_number: String(order.number), order_date: placedOn, customer_name: customer };

  const subject = oneLine(fill(settings.subject || DEFAULT_SUBJECT, vars));
  const heading = oneLine(fill(settings.heading || DEFAULT_HEADING, vars));
  const extra = fill(settings.additionalContent, vars).trim();
  const paid = order.paymentStatus === "paid";
  const adminUrl = context.storefrontUrl ? `${context.storefrontUrl}/adminecho5/orders/${order.number}` : undefined;

  // ---- plain text -----------------------------------------------------------
  const text = [
    heading,
    `Placed on ${placedOn} by ${customer}`,
    "",
    `Order total: ${money(order.total)}`,
    `Payment: ${paid ? "Paid" : "Pending"}`,
    "",
    ...plainOrderLines(order),
    "",
    "CUSTOMER",
    customer,
    order.email,
    order.shipping.phone,
    "",
    order.billingSameAsShipping ? "SHIPPING & BILLING ADDRESS" : "SHIPPING ADDRESS",
    ...addressLines(order.shipping),
    ...(order.billingSameAsShipping ? [] : ["", "BILLING ADDRESS", ...addressLines(order.billing)]),
    ...(order.note ? ["", "NOTE FROM THE CUSTOMER", order.note] : []),
    ...(extra ? ["", extra] : []),
    ...(adminUrl ? ["", `View the order: ${adminUrl}`] : []),
  ].join("\n");

  // ---- HTML -----------------------------------------------------------------
  const cards = [
    { title: "Customer", body: `<strong>${esc(customer)}</strong><br><a href="mailto:${esc(order.email)}" style="color:${GOLD_DARK};">${esc(order.email)}</a><br><a href="${esc(phoneLink(order.shipping.phone))}" style="color:${GOLD_DARK};">${esc(order.shipping.phone)}</a>` },
    { title: order.billingSameAsShipping ? "Shipping & billing address" : "Shipping address", body: addressBlock(order.shipping) },
    ...(order.billingSameAsShipping ? [] : [{ title: "Billing address", body: addressBlock(order.billing) }]),
  ];

  const rows = [
    row(heroBlock("New order", heading, `<div style="margin-top:10px;font-size:14px;line-height:1.5;color:${MUTED};">Placed on ${esc(placedOn)} by <strong style="color:${INK};">${esc(customer)}</strong></div>`), "36px 40px 4px"),
    row(statusChips(order), "18px 40px 0"),
    row(totalBox(order), "14px 40px 0"),
    row(itemsBlock(order, context), "30px 40px 0"),
    row(totalsBlock(order), "4px 40px 0"),
    row(cardsBlock(cards), "30px 40px 0"),
    order.note ? row(noteBlock("Note from the customer", order.note), "8px 40px 0") : "",
    extra ? `<tr><td class="px" style="padding:22px 40px 0;font-size:15px;line-height:1.7;color:${INK};">${escLines(extra)}</td></tr>` : "",
    adminUrl ? `<tr><td class="px" align="center" style="padding:30px 40px 0;">${buttonBlock("View order in admin", adminUrl)}</td></tr>` : "",
  ].join("\n      ");

  const html = emailDocument({
    title: subject,
    preheader: `Order #${order.number} · ${money(order.total)} from ${customer}`,
    rows,
    footer: `This email was sent automatically by ${esc(context.siteName)} because a new order was placed.<br>You can change who receives it in the admin under Settings &rarr; Emails.`,
    context,
  });

  return { subject, html, text, ...(attachments && { attachments }) };
}
