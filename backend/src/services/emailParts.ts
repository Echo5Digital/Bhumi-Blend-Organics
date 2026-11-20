// The pieces both order emails (the owner's "New order" and the customer's "Order received") are built
// from, so they look like one shop: colours, formatting, HTML escaping, the page shell, the item list,
// the totals and the address cards. Table-based HTML with inline styles, because that is what Gmail,
// Outlook and phones all render the same way.

import type { MailAttachment } from "./mailer.js";
import { LOGO_CID } from "./emailLogo.js";

export type AddressLike = {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pin: string;
  country?: string | null;
  phone: string;
};

export type EmailOrder = {
  number: number;
  createdAt: Date;
  email: string;
  items: { name: string; size?: string | null; qty: number; unitPrice: number; lineTotal: number; image?: string | null }[];
  shipping: AddressLike;
  billing: AddressLike;
  billingSameAsShipping: boolean;
  note?: string | null;
  coupon?: { code?: string | null; discount?: number | null } | null;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  paymentStatus: string;
};

export type RenderContext = {
  siteName: string;
  /** The live shop address (STOREFRONT_URL). Used for buttons, and for the logo and product photos when it is https. */
  storefrontUrl?: string;
  /** The shop's contact details from Settings → General, shown to customers ("Questions? ..."). */
  contactEmail?: string;
  contactPhone?: string;
  /** Show the logo from a copy carried inside the email (`cid:bb-logo`, see emailLogo.ts) instead of loading it from the shop's website. */
  inlineLogo?: boolean;
  /** The logo's height in pixels (60 when not set). */
  logoHeight?: number;
};

/** A built email. `attachments` are the pictures its HTML refers to as `cid:...`; send them along with it. */
export type RenderedEmail = { subject: string; html: string; text: string; attachments?: MailAttachment[] };

export const GOLD = "#ce8e22";
export const GOLD_DARK = "#b8791f";
export const INK = "#1f1608";
export const MUTED = "#6f6454";
export const LINE = "#efe7d3";
export const PAGE = "#f5f1e6";
export const SERIF = "Georgia,'Times New Roman',serif";
export const SANS = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
export const money = (value: number) => rupees.format(value);
const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
export const formatDateTime = (date: Date) => dateTime.format(date);

export const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
export const escLines = (value: string) => esc(value).replace(/\r?\n/g, "<br>");
export const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

/** Replaces {site_title}, {order_number}, {order_date} and {customer_name} in text the admin typed. */
export function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(site_title|order_number|order_date|customer_name)\}/g, (_match, key: string) => vars[key] ?? "");
}

export function absoluteImage(image: string | null | undefined, storefrontUrl?: string) {
  if (!image) return undefined;
  if (/^https:\/\//i.test(image)) return image;
  if (image.startsWith("/") && storefrontUrl?.startsWith("https://")) return `${storefrontUrl}${encodeURI(image)}`;
  return undefined; // a local address an email app on someone's phone can't open
}

export const nameOf = (a: AddressLike) => `${a.firstName} ${a.lastName}`.trim();
export const addressLines = (a: AddressLike) => [nameOf(a), a.line1, a.line2 ?? "", `${a.city} ${a.pin}`.trim(), a.state, a.country ?? "India"].map((line) => line.trim()).filter(Boolean);
export const phoneLink = (phone: string) => `tel:+91${phone.replace(/\D/g, "").slice(-10)}`;

export const chip = (text: string, background: string, color: string) =>
  `<span style="display:inline-block;margin:0 6px 6px 0;padding:6px 13px;border-radius:999px;background:${background};color:${color};font-size:12px;font-weight:700;letter-spacing:0.02em;">${esc(text)}</span>`;

export const label = (text: string) => `<div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${GOLD_DARK};">${esc(text)}</div>`;

/** The payment chip, the item count chip and (when there is one) the coupon chip. */
export function statusChips(order: EmailOrder) {
  const count = order.items.reduce((sum, item) => sum + item.qty, 0);
  return [
    order.paymentStatus === "paid" ? chip("Paid", "#e3f3e8", "#1d5b32") : chip("Payment pending", "#fbf1dc", "#6b4a10"),
    chip(`${count} ${count === 1 ? "item" : "items"}`, "#f4f0e6", INK),
    order.coupon?.code ? chip(`Coupon ${order.coupon.code}`, "#f4f0e6", INK) : "",
  ].join("");
}

/** A full-width row of the email's card, with the side padding that shrinks on phones. */
export const row = (inner: string, padding = "0 40px") => `<tr><td class="px" style="padding:${padding};">${inner}</td></tr>`;

export function totalBox(order: EmailOrder) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf3de;border:1px solid #f0dfb4;border-radius:14px;"><tr>
          <td style="padding:18px 22px;">${label("Order total")}<div style="margin-top:4px;font-size:12px;color:${MUTED};">Free shipping included</div></td>
          <td class="total-big" align="right" style="padding:18px 22px;font-family:${SERIF};font-size:32px;font-weight:700;color:${INK};white-space:nowrap;">${money(order.total)}</td>
        </tr></table>`;
}

/** "What was ordered": each product with its photo (when it can be shown), size, quantity and line price. */
export function itemsBlock(order: EmailOrder, context: RenderContext) {
  const rows = order.items
    .map((item) => {
      const src = absoluteImage(item.image, context.storefrontUrl);
      const image = src ? `<td width="64" valign="top" style="padding-right:14px;"><img src="${esc(src)}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;border-radius:10px;object-fit:cover;border:1px solid ${LINE};"></td>` : "";
      const detail = [item.size, `Qty ${item.qty}`, `${money(item.unitPrice)} each`].filter(Boolean).join(" · ");
      return `<tr><td style="padding:14px 0;border-top:1px solid ${LINE};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${image}<td valign="top"><div style="font-size:15px;font-weight:600;color:${INK};">${esc(item.name)}</div><div style="margin-top:3px;font-size:13px;color:${MUTED};">${esc(detail)}</div></td><td align="right" valign="top" style="white-space:nowrap;font-size:15px;font-weight:600;color:${INK};padding-left:12px;">${money(item.lineTotal)}</td></tr></table></td></tr>`;
    })
    .join("");
  return `${label("What was ordered")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">${rows}</table>`;
}

export function totalsBlock(order: EmailOrder) {
  const line = (name: string, value: string) => `<tr><td style="padding:6px 0;font-size:14px;color:${MUTED};">${name}</td><td align="right" style="padding:6px 0;font-size:14px;color:${INK};">${value}</td></tr>`;
  const couponText = order.coupon?.code ? ` (${order.coupon.code})` : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE};">
          ${line("Subtotal", money(order.subtotal))}
          ${order.discountTotal > 0 ? line(`Discount${esc(couponText)}`, `&minus;${money(order.discountTotal)}`) : ""}
          ${line("Shipping", order.shippingTotal > 0 ? money(order.shippingTotal) : "Free")}
          <tr><td style="padding:12px 0 0;border-top:2px solid ${GOLD};font-family:${SERIF};font-size:18px;font-weight:700;color:${INK};">Total</td><td align="right" style="padding:12px 0 0;border-top:2px solid ${GOLD};font-family:${SERIF};font-size:18px;font-weight:700;color:${INK};">${money(order.total)}</td></tr>
        </table>`;
}

export const addressBlock = (a: AddressLike) => addressLines(a).map((line, index) => (index === 0 ? `<strong>${esc(line)}</strong>` : esc(line))).join("<br>");

/** Boxed details (customer, addresses), two to a row on a desktop and one per row on a phone. */
export function cardsBlock(cards: { title: string; body: string }[]) {
  const one = (card: { title: string; body: string }, side: "left" | "right") =>
    `<td class="stack" width="50%" valign="top" style="padding:0 ${side === "left" ? "6px" : "0"} 12px ${side === "left" ? "0" : "6px"};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf7ec;border:1px solid #f1e8d2;border-radius:12px;"><tr><td style="padding:16px 18px;">${label(card.title)}<div style="margin-top:8px;font-size:14px;line-height:1.6;color:${INK};">${card.body}</div></td></tr></table></td>`;
  const rows: string[] = [];
  for (let index = 0; index < cards.length; index += 2) {
    const left = cards[index]!;
    const right = cards[index + 1];
    rows.push(`<tr>${one(left, "left")}${right ? one(right, "right") : `<td class="stack" width="50%"></td>`}</tr>`);
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.join("")}</table>`;
}

/** A quote-style block, e.g. the note the customer left on the order. */
export const noteBlock = (title: string, text: string) =>
  `<div style="border-left:3px solid ${GOLD};padding:6px 0 6px 16px;"><div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};">${esc(title)}</div><div style="margin-top:6px;font-size:15px;line-height:1.6;font-style:italic;color:${INK};">${escLines(text)}</div></div>`;

export const buttonBlock = (text: string, href: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:${GOLD};color:${INK};font-size:15px;font-weight:700;text-decoration:none;padding:15px 34px;border-radius:999px;">${esc(text)}</a>`;

export const heroBlock = (kicker: string, heading: string, below: string) =>
  `${label(kicker)}<h1 class="h1" style="margin:10px 0 0;font-family:${SERIF};font-size:32px;line-height:1.2;font-weight:700;color:${INK};">${esc(heading)}</h1>${below}`;

function logo(context: RenderContext) {
  const height = context.logoHeight ?? 60;
  if (context.inlineLogo) {
    return `<img src="cid:${LOGO_CID}" alt="${esc(context.siteName)}" height="${height}" style="display:block;margin:0 auto;height:${height}px;border:0;">`;
  }
  return context.storefrontUrl?.startsWith("https://")
    ? `<img src="${esc(context.storefrontUrl)}/bb_logo_.png" alt="${esc(context.siteName)}" height="${height}" style="display:block;margin:0 auto;height:${height}px;border:0;">`
    : `<div style="font-family:${SERIF};font-size:24px;font-weight:700;letter-spacing:0.18em;color:${GOLD_DARK};">BHUMI BLEND</div><div style="margin-top:4px;font-size:10px;letter-spacing:0.32em;color:#9a7a3a;">ORGANICS</div>`;
}

/** The whole HTML page: the logo, the white card with its gold strip around `rows`, and the small print. */
export function emailDocument({ title, preheader, rows, footer, context }: { title: string; preheader: string; rows: string; footer: string; context: RenderContext }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title>
<style>
@media only screen and (max-width:620px){
  .container{width:100%!important}
  .px{padding-left:22px!important;padding-right:22px!important}
  .stack{display:block!important;width:100%!important;padding-left:0!important;padding-right:0!important}
  .total-big{font-size:26px!important}
  .h1{font-size:26px!important}
}
</style></head>
<body style="margin:0;padding:0;background:${PAGE};font-family:${SANS};color:${INK};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE};"><tr><td align="center" style="padding:32px 12px 40px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
  <tr><td align="center" style="padding:0 0 22px;">${logo(context)}</td></tr>
  <tr><td style="background:#ffffff;border:1px solid #ece3cf;border-radius:18px;overflow:hidden;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="height:6px;line-height:6px;font-size:0;background:${GOLD};">&nbsp;</td></tr>
      ${rows}
      <tr><td style="height:38px;line-height:38px;font-size:0;">&nbsp;</td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:22px 24px 0;font-size:12px;line-height:1.6;color:#8a7f6c;">${footer}</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ---- plain text -------------------------------------------------------------

export function plainOrderLines(order: EmailOrder): string[] {
  const couponText = order.coupon?.code ? ` (${order.coupon.code})` : "";
  return [
    "WHAT WAS ORDERED",
    ...order.items.map((item) => `- ${item.name}${item.size ? ` (${item.size})` : ""} x ${item.qty}: ${money(item.lineTotal)}`),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    ...(order.discountTotal > 0 ? [`Discount${couponText}: -${money(order.discountTotal)}`] : []),
    `Shipping: ${order.shippingTotal > 0 ? money(order.shippingTotal) : "Free"}`,
    `Total: ${money(order.total)}`,
  ];
}
