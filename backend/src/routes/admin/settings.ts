import { Router } from "express";
import { z } from "zod";
import { INDIAN_STATES, parse } from "../../lib/validation.js";
import { Setting, getSettings } from "../../models/Setting.js";
import type { StorefrontNotifier } from "../../services/storefront.js";

// Settings → General in the admin: the store's address and contact details, and
// the switches that change how the shop behaves (coupons on/off, low-stock level).

const blankOr = <T extends z.ZodType>(schema: T) => z.union([z.literal(""), schema]);

const settingsSchema = z.object({
  storeName: z.string().trim().min(1, "The store needs a name.").max(100),
  address: z.object({
    line1: z.string().trim().max(200),
    line2: z.string().trim().max(200),
    city: z.string().trim().max(80),
    state: blankOr(z.enum(INDIAN_STATES)),
    pin: blankOr(z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code.")),
    country: z.literal("India"),
  }),
  contactEmail: blankOr(z.email("Enter a valid email address.").max(254)),
  contactPhone: z.string().trim().max(30),
  couponsEnabled: z.boolean(),
  lowStockThreshold: z.number().int().min(0).max(100_000),
});

export function adminSettingsRoutes(notifier: StorefrontNotifier): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json({ settings: await getSettings() });
  });

  // Saves everything on the form at once (the page sends the whole thing).
  router.put("/", async (req, res) => {
    const settings = parse(settingsSchema, req.body);
    await Setting.findByIdAndUpdate("general", { $set: settings }, { upsert: true, returnDocument: "after", runValidators: true });
    notifier.revalidate(["settings"]);
    res.json({ settings: await getSettings() });
  });

  return router;
}
