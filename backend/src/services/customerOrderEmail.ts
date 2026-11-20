import { Setting } from "../models/Setting.js";
import { withLogo } from "./emailLogo.js";
import {
  addressBlock,
  addressLines,
  buttonBlock,
  cardsBlock,
  emailDocument,
  esc,
  escLines,
  fill,
  formatDateTime,
  heroBlock,
  itemsBlock,
  money,
  nameOf,
  noteBlock,
  oneLine,
  plainOrderLines,
  row,
  statusChips,
  totalBox,
  totalsBlock,
  INK,
  MUTED,
  GOLD_DARK,
  type EmailOrder,
  type RenderContext,
  type RenderedEmail,
} from "./emailParts.js";
import type { NewOrderEmailSettings } from "./newOrderEmail.js";

// The "Order received" email: what the shopper gets right after they place an order (Settings → Emails →
// Order received in the admin). It goes to the address they gave at checkout. Same look as the owner's
// "New order" email (both are built from emailParts.ts), but written for the customer.

export const DEFAULT_CUSTOMER_SUBJECT = "Your {site_title} order has been received!";
export const DEFAULT_CUSTOMER_HEADING = "Thank you for your order";

/** The saved settings for this email. It has no recipients: it always goes to the customer. */
export async function loadCustomerOrderEmail(): Promise<NewOrderEmailSettings> {
  const saved = (await Setting.findById("general").lean())?.customerOrderEmail;
  return {
    enabled: saved?.enabled ?? true,
    recipients: "",
    subject: saved?.subject ?? "",
    heading: saved?.heading ?? "",
    additionalContent: saved?.additionalContent ?? "",
    format: saved?.format ?? "html",
  };
}

export function renderCustomerOrderEmail(order: EmailOrder, settings: NewOrderEmailSettings, shop: RenderContext): RenderedEmail {
  const { context, attachments } = withLogo(shop); // the logo travels inside the email
  const customer = nameOf(order.shipping) || order.email;
  const firstName = order.shipping.firstName.trim() || "there";
  const placedOn = formatDateTime(order.createdAt);
  const vars = { site_title: context.siteName, order_number: String(order.number), order_date: placedOn, customer_name: customer };

  const subject = oneLine(fill(settings.subject || DEFAULT_CUSTOMER_SUBJECT, vars));
  const heading = oneLine(fill(settings.heading || DEFAULT_CUSTOMER_HEADING, vars));
  const extra = fill(settings.additionalContent, vars).trim();
  const paid = order.paymentStatus === "paid";
  const intro = paid
    ? `Thanks for shopping with ${context.siteName}. We've received your payment and your order #${order.number} is being prepared.`
    : `Thanks for shopping with ${context.siteName}. We've received your order #${order.number}. Payment for it is still pending.`;
  const accountUrl = context.storefrontUrl ? `${context.storefrontUrl}/my-account/orders` : undefined;
  const contact = [context.contactEmail, context.contactPhone].filter(Boolean).join(" · ");

  // ---- plain text -----------------------------------------------------------
  const text = [
    heading,
    "",
    `Hi ${firstName},`,
    intro,
    "",
    `Order #${order.number} · ${placedOn}`,
    `Payment: ${paid ? "Paid" : "Pending"}`,
    "",
    ...plainOrderLines(order),
    "",
    order.billingSameAsShipping ? "SHIPPING & BILLING ADDRESS" : "SHIPPING ADDRESS",
    ...addressLines(order.shipping),
    ...(order.billingSameAsShipping ? [] : ["", "BILLING ADDRESS", ...addressLines(order.billing)]),
    ...(order.note ? ["", "YOUR NOTE", order.note] : []),
    ...(extra ? ["", extra] : []),
    ...(accountUrl ? ["", `See your orders: ${accountUrl}`] : []),
    ...(contact ? ["", `Questions? ${contact}`] : []),
  ].join("\n");

  // ---- HTML -----------------------------------------------------------------
  const cards = [
    { title: order.billingSameAsShipping ? "Shipping & billing address" : "Shipping address", body: addressBlock(order.shipping) },
    ...(order.billingSameAsShipping ? [] : [{ title: "Billing address", body: addressBlock(order.billing) }]),
  ];

  const rows = [
    row(
      heroBlock(
        "Order received",
        heading,
        `<p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:${INK};">Hi ${esc(firstName)},</p><p style="margin:8px 0 0;font-size:15px;line-height:1.7;color:${INK};">${esc(intro)}</p><div style="margin-top:12px;font-size:13px;color:${MUTED};">Order #${order.number} · placed on ${esc(placedOn)}</div>`,
      ),
      "36px 40px 4px",
    ),
    row(statusChips(order), "18px 40px 0"),
    row(totalBox(order), "14px 40px 0"),
    row(itemsBlock(order, context), "30px 40px 0"),
    row(totalsBlock(order), "4px 40px 0"),
    row(cardsBlock(cards), "30px 40px 0"),
    order.note ? row(noteBlock("Your note", order.note), "8px 40px 0") : "",
    extra ? `<tr><td class="px" style="padding:22px 40px 0;font-size:15px;line-height:1.7;color:${INK};">${escLines(extra)}</td></tr>` : "",
    accountUrl ? `<tr><td class="px" align="center" style="padding:30px 40px 0;">${buttonBlock("See your orders", accountUrl)}</td></tr>` : "",
    contact ? `<tr><td class="px" align="center" style="padding:22px 40px 0;font-size:14px;line-height:1.6;color:${MUTED};">Questions about your order? Reach us at <strong style="color:${GOLD_DARK};">${esc(contact)}</strong>.</td></tr>` : "",
  ].join("\n      ");

  const html = emailDocument({
    title: subject,
    preheader: `We've received your order #${order.number} · ${money(order.total)}`,
    rows,
    footer: `You're receiving this email because you placed an order at ${esc(context.siteName)}.`,
    context,
  });

  return { subject, html, text, ...(attachments && { attachments }) };
}
