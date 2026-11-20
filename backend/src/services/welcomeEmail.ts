import type { Env } from "../config/env.js";
import { Setting, getSettings } from "../models/Setting.js";
import { inlineAttachments, withLogo } from "./emailLogo.js";
import { buttonBlock, emailDocument, esc, escLines, fill, heroBlock, oneLine, row, GOLD_DARK, INK, MUTED, type RenderContext, type RenderedEmail } from "./emailParts.js";
import type { Mailer } from "./mailer.js";
import type { NewOrderEmailSettings } from "./newOrderEmail.js";

// The "New account" (welcome) email: what a shopper gets the moment their account is created (Settings →
// Emails → New account in the admin). It goes to the address they signed up with. Same look as the order
// emails (all built from emailParts.ts); the shop's logo travels inside the email itself (emailLogo.ts).

export const DEFAULT_WELCOME_SUBJECT = "Welcome to {site_title}! Your account is ready";
export const DEFAULT_WELCOME_HEADING = "Welcome to {site_title}";
/** What the admin can type into this email's subject, heading and extra text. */
export const WELCOME_PLACEHOLDERS = ["{site_title}", "{customer_name}"] as const;

export type WelcomeCustomer = { email: string; firstName: string; lastName: string };

/** A made-up new customer, for the admin's preview and the "send a test email" button. */
export const sampleCustomer = (): WelcomeCustomer => ({ email: "john@example.com", firstName: "John", lastName: "Doe" });

/** The saved settings for this email. It has no recipients: it always goes to the new customer. */
export async function loadWelcomeEmail(): Promise<NewOrderEmailSettings> {
  const saved = (await Setting.findById("general").lean())?.welcomeEmail;
  return {
    enabled: saved?.enabled ?? true,
    recipients: "",
    subject: saved?.subject ?? "",
    heading: saved?.heading ?? "",
    additionalContent: saved?.additionalContent ?? "",
    format: saved?.format ?? "html",
  };
}

export function renderWelcomeEmail(customer: WelcomeCustomer, settings: NewOrderEmailSettings, shop: RenderContext): RenderedEmail {
  // The logo goes inside the email when the file is there; otherwise the email keeps its text logo.
  const { context, attachments } = withLogo(shop);

  const fullName = `${customer.firstName} ${customer.lastName}`.trim() || customer.email;
  const firstName = customer.firstName.trim() || "there";
  const vars = { site_title: context.siteName, customer_name: fullName };

  const subject = oneLine(fill(settings.subject || DEFAULT_WELCOME_SUBJECT, vars));
  const heading = oneLine(fill(settings.heading || DEFAULT_WELCOME_HEADING, vars));
  const extra = fill(settings.additionalContent, vars).trim();
  const accountUrl = context.storefrontUrl ? `${context.storefrontUrl}/my-account` : undefined;
  const contact = [context.contactEmail, context.contactPhone].filter(Boolean).join(" · ");
  const thanks = `Thanks for creating an account on ${context.siteName}. Your username is your email address, `;
  const whatYouCanDo = "From your account you can view your orders, change your password and more.";
  const year = new Date().getFullYear();

  // ---- plain text -----------------------------------------------------------
  const text = [
    heading,
    "",
    `Hi ${firstName},`,
    "",
    `${thanks}${customer.email}.`,
    whatYouCanDo,
    ...(accountUrl ? ["", `Your account: ${accountUrl}`] : []),
    "",
    "We look forward to seeing you soon.",
    ...(extra ? ["", extra] : []),
    ...(contact ? ["", `Questions? ${contact}`] : []),
    "",
    `© ${year} ${context.siteName}. All Rights Reserved.`,
  ].join("\n");

  // ---- HTML -----------------------------------------------------------------
  const paragraph = (inner: string, top = 12) => `<p style="margin:${top}px 0 0;font-size:15px;line-height:1.7;color:${INK};">${inner}</p>`;
  const rows = [
    row(
      heroBlock(
        "Welcome",
        heading,
        `<p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:${INK};">Hi ${esc(firstName)},</p>${paragraph(`${esc(thanks)}<strong>${esc(customer.email)}</strong>.`, 8)}${paragraph(esc(whatYouCanDo))}`,
      ),
      "36px 40px 4px",
    ),
    accountUrl ? `<tr><td class="px" align="center" style="padding:28px 40px 0;">${buttonBlock("Go to my account", accountUrl)}</td></tr>` : "",
    row(paragraph("We look forward to seeing you soon.", 0), "26px 40px 0"),
    extra ? `<tr><td class="px" style="padding:18px 40px 0;font-size:15px;line-height:1.7;color:${INK};">${escLines(extra)}</td></tr>` : "",
    contact ? `<tr><td class="px" align="center" style="padding:24px 40px 0;font-size:14px;line-height:1.6;color:${MUTED};">Questions? Reach us at <strong style="color:${GOLD_DARK};">${esc(contact)}</strong>.</td></tr>` : "",
  ].join("\n      ");

  const html = emailDocument({
    title: subject,
    preheader: `Your ${context.siteName} account is ready.`,
    rows,
    footer: `&copy; ${year} ${esc(context.siteName)}. All Rights Reserved.<br>You're receiving this email because an account was created at ${esc(context.siteName)} with this address.`,
    context,
  });

  return { subject, html, text, ...(attachments && { attachments }) };
}

/** A preview for a browser: the logo is put into the page itself, since a browser can't open `cid:` pictures. */
export function previewHtml(message: RenderedEmail): string {
  return inlineAttachments(message.html, message.attachments);
}

/** Called when a new account is created. Never throws: the account already exists, an email problem must not undo that. */
export type WelcomeNotifier = (customer: WelcomeCustomer) => Promise<void>;

/** For tests and apps that don't send mail. */
export const silentWelcomeNotifier: WelcomeNotifier = async () => {};

/** Sends the welcome email to a new customer (unless it is switched off in the admin). */
export function createWelcomeNotifier({ env, mailer }: { env: Pick<Env, "STOREFRONT_URL" | "NODE_ENV">; mailer: Mailer }): WelcomeNotifier {
  return async (customer) => {
    try {
      const settings = await loadWelcomeEmail();
      if (!settings.enabled) return;
      const { storeName, contactEmail, contactPhone } = await getSettings();
      const message = renderWelcomeEmail(customer, settings, {
        siteName: storeName,
        storefrontUrl: env.STOREFRONT_URL?.replace(/\/+$/, ""),
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
      });
      await mailer.send({
        to: customer.email,
        subject: message.subject,
        text: message.text,
        ...(settings.format === "html" && { html: message.html, ...(message.attachments && { attachments: message.attachments }) }),
      });
      // Failures are logged below; this line is what tells you a welcome email really left (silence = it never ran).
      if (env.NODE_ENV !== "test") console.log(`Welcome email ${mailer.configured ? "sent" : "printed (no SMTP)"} to ${customer.email}.`);
    } catch (error) {
      console.error(`Welcome email for ${customer.email} failed:`, error instanceof Error ? error.message : error);
    }
  };
}
