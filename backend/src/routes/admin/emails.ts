import { Router } from "express";
import { z } from "zod";
import type { Env } from "../../config/env.js";
import { HttpError } from "../../lib/httpError.js";
import { parse } from "../../lib/validation.js";
import { Setting, getSettings } from "../../models/Setting.js";
import { DEFAULT_CUSTOMER_HEADING, DEFAULT_CUSTOMER_SUBJECT, loadCustomerOrderEmail, renderCustomerOrderEmail } from "../../services/customerOrderEmail.js";
import type { Mailer } from "../../services/mailer.js";
import { DEFAULT_HEADING, DEFAULT_SUBJECT, PLACEHOLDERS, loadNewOrderEmail, parseRecipients, renderNewOrderEmail, sampleOrder, type NewOrderEmailSettings, type RenderContext } from "../../services/newOrderEmail.js";
import { DEFAULT_WELCOME_HEADING, DEFAULT_WELCOME_SUBJECT, WELCOME_PLACEHOLDERS, loadWelcomeEmail, previewHtml, renderWelcomeEmail, sampleCustomer } from "../../services/welcomeEmail.js";

// Settings → Emails in the admin. Three emails, each with the same screen: switch it on or off, its wording,
// a live preview of it built from made-up data, and a button that sends a test copy.
//   new-order       goes to the shop owner (the recipients are set here)
//   order-received  goes to the customer who placed the order
//   welcome         goes to a customer when they create an account

const owner = z.object({
  enabled: z.boolean(),
  recipients: z
    .string()
    .trim()
    .max(500)
    .refine((value) => parseRecipients(value).invalid.length === 0, "Enter valid email addresses, separated by commas."),
  subject: z.string().trim().max(200),
  heading: z.string().trim().max(200),
  additionalContent: z.string().trim().max(1000),
  format: z.enum(["html", "plain"]),
});
const customer = owner.omit({ recipients: true });

export function adminEmailRoutes({ env, mailer }: { env: Env; mailer: Mailer }): Router {
  const router = Router();

  // Per email: how the admin screen words it, where its settings are saved, and `build`, which makes the
  // email from made-up data (a sample order, or a sample new customer) for the preview and the test send.
  const kinds = {
    "new-order": {
      title: "New order",
      description: "Sent to the shop owner when a new order is placed.",
      intro: "New order emails are sent to the chosen recipient(s) when a new order is received.",
      recipientLine: "",
      sample: "a sample order",
      placeholders: PLACEHOLDERS as readonly string[],
      field: "newOrderEmail",
      recipientsEditable: true,
      schema: owner,
      defaults: { recipients: env.ORDER_NOTIFY_EMAILS ?? "", subject: DEFAULT_SUBJECT, heading: DEFAULT_HEADING },
      load: () => loadNewOrderEmail(env),
      build: (settings: NewOrderEmailSettings, context: RenderContext) => renderNewOrderEmail(sampleOrder(), settings, context),
    },
    "order-received": {
      title: "Order received",
      description: "Sent to the customer right after they place an order.",
      intro: "This email goes to the customer, at the address they entered at checkout, right after they place an order.",
      recipientLine: "The customer who placed the order (the email address they entered at checkout).",
      sample: "a sample order",
      placeholders: PLACEHOLDERS as readonly string[],
      field: "customerOrderEmail",
      recipientsEditable: false,
      schema: customer,
      defaults: { recipients: "", subject: DEFAULT_CUSTOMER_SUBJECT, heading: DEFAULT_CUSTOMER_HEADING },
      load: () => loadCustomerOrderEmail(),
      build: (settings: NewOrderEmailSettings, context: RenderContext) => renderCustomerOrderEmail(sampleOrder(), settings, context),
    },
    welcome: {
      title: "New account",
      description: "Sent to a customer right after they create an account.",
      intro: "This email welcomes a new customer, at the address they signed up with, the moment their account is created.",
      recipientLine: "The new customer (the email address they signed up with).",
      sample: "a sample new customer",
      placeholders: WELCOME_PLACEHOLDERS as readonly string[],
      field: "welcomeEmail",
      recipientsEditable: false,
      schema: customer,
      defaults: { recipients: "", subject: DEFAULT_WELCOME_SUBJECT, heading: DEFAULT_WELCOME_HEADING },
      load: () => loadWelcomeEmail(),
      build: (settings: NewOrderEmailSettings, context: RenderContext) => renderWelcomeEmail(sampleCustomer(), settings, context),
    },
  } as const;
  type Kind = keyof typeof kinds;

  const kindOf = (value: string | undefined) => {
    if (!value || !(value in kinds)) throw HttpError.notFound("There is no such email.", "EMAIL_NOT_FOUND");
    return kinds[value as Kind];
  };

  const renderContext = async (): Promise<RenderContext> => {
    const { storeName, contactEmail, contactPhone } = await getSettings();
    return { siteName: storeName, storefrontUrl: env.STOREFRONT_URL?.replace(/\/+$/, ""), contactEmail: contactEmail || undefined, contactPhone: contactPhone || undefined };
  };

  // The Emails tab: one line per email.
  router.get("/", async (_req, res) => {
    const emails = await Promise.all(
      (Object.keys(kinds) as Kind[]).map(async (key) => {
        const kind = kinds[key];
        const settings = await kind.load();
        return { key, title: kind.title, description: kind.description, enabled: settings.enabled, recipients: kind.recipientsEditable ? settings.recipients : "" };
      }),
    );
    res.json({ emails, emailConfigured: mailer.configured });
  });

  router.get("/:kind", async (req, res) => {
    const kind = kindOf(req.params.kind);
    res.json({
      key: req.params.kind,
      title: kind.title,
      description: kind.description,
      recipientsEditable: kind.recipientsEditable,
      // the wording the screen shows for this email
      intro: kind.intro,
      recipientLine: kind.recipientLine,
      sample: kind.sample,
      settings: await kind.load(),
      // what an empty field falls back to (shown as its placeholder)
      defaults: kind.defaults,
      placeholders: kind.placeholders,
      emailConfigured: mailer.configured,
    });
  });

  router.put("/:kind", async (req, res) => {
    const kind = kindOf(req.params.kind);
    const values = parse(kind.schema, req.body);
    await Setting.findByIdAndUpdate("general", { $set: { [kind.field]: values } }, { upsert: true, runValidators: true });
    res.json({ settings: await kind.load() });
  });

  /** The saved settings with whatever the admin has typed on the page but not saved yet laid over them. */
  const withDraft = async (kind: ReturnType<typeof kindOf>, body: unknown): Promise<NewOrderEmailSettings> => ({ ...(await kind.load()), ...parse(kind.schema.partial(), body) });

  // The email built from made-up data, with the settings as they are on the page right now.
  router.post("/:kind/preview", async (req, res) => {
    const kind = kindOf(req.params.kind);
    const settings = await withDraft(kind, req.body);
    const message = kind.build(settings, await renderContext());
    // (a browser can't open the logo that travels inside the real email, so the preview carries it in the page)
    res.json({ subject: message.subject, text: message.text, html: previewHtml(message), format: settings.format });
  });

  // "Send a test email": the same made-up data, to one address.
  router.post("/:kind/test", async (req, res) => {
    const kind = kindOf(req.params.kind);
    const { to, ...rest } = parse(kind.schema.partial().extend({ to: z.email("Enter a valid email address.").max(254) }), req.body);
    const settings = { ...(await kind.load()), ...rest };
    const message = kind.build(settings, await renderContext());
    await mailer.send({
      to,
      subject: `[TEST] ${message.subject}`,
      text: message.text,
      ...(settings.format === "html" && { html: message.html, ...(message.attachments && { attachments: message.attachments }) }),
    });
    res.json({ sent: true, delivery: mailer.configured ? "email" : "console" });
  });

  return router;
}
