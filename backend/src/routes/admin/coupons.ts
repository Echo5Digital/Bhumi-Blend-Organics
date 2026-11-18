import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { HttpError } from "../../lib/httpError.js";
import { toUpdate } from "../../lib/updates.js";
import { paginationSchema, parse } from "../../lib/validation.js";
import { Coupon } from "../../models/Coupon.js";

const base = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{3,40}$/, "3–40 letters, numbers, dashes or underscores.")
    .transform((code) => code.toUpperCase()),
  description: z.string().trim().max(200),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive().max(1_000_000),
  maxDiscount: z.number().positive().max(1_000_000),
  minSubtotal: z.number().min(0).max(1_000_000),
  startsAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  usageLimit: z.number().int().min(1),
  isActive: z.boolean(),
});

const clearable = ["description", "maxDiscount", "startsAt", "expiresAt", "usageLimit"] as const;
const createSchema = base
  .partial()
  .required({ code: true, type: true, value: true })
  .refine((data) => data.type !== "percent" || data.value <= 100, { message: "A percent coupon can't be more than 100.", path: ["value"] });
const updateSchema = z
  .object({
    ...base.partial().shape,
    ...Object.fromEntries(clearable.map((key) => [key, base.shape[key].nullable().optional()])),
  })
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to change.");

const lookup = (idOrCode: string) => (mongoose.isValidObjectId(idOrCode) ? { _id: idOrCode } : { code: idOrCode.toUpperCase() });

type CouponView = {
  _id: unknown;
  code: string;
  description?: string | null;
  type: string;
  value: number;
  maxDiscount?: number | null;
  minSubtotal?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
};
const view = (coupon: CouponView) => ({
  id: String(coupon._id),
  code: coupon.code,
  description: coupon.description ?? undefined,
  type: coupon.type,
  value: coupon.value,
  maxDiscount: coupon.maxDiscount ?? undefined,
  minSubtotal: coupon.minSubtotal ?? 0,
  startsAt: coupon.startsAt ?? undefined,
  expiresAt: coupon.expiresAt ?? undefined,
  usageLimit: coupon.usageLimit ?? undefined,
  usedCount: coupon.usedCount,
  isActive: coupon.isActive,
});

export function adminCouponRoutes(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const query = parse(paginationSchema, req.query);
    const [items, total] = await Promise.all([
      Coupon.find()
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      Coupon.countDocuments(),
    ]);
    res.json({ items: items.map(view), page: query.page, limit: query.limit, total, pages: Math.max(1, Math.ceil(total / query.limit)) });
  });

  router.get("/:idOrCode", async (req, res) => {
    const coupon = await Coupon.findOne(lookup(req.params.idOrCode)).lean();
    if (!coupon) throw HttpError.notFound("Coupon not found.", "COUPON_NOT_FOUND");
    res.json({ coupon: view(coupon) });
  });

  router.post("/", async (req, res) => {
    const coupon = await Coupon.create(parse(createSchema, req.body));
    res.status(201).json({ coupon: view(coupon.toObject()) });
  });

  router.patch("/:idOrCode", async (req, res) => {
    const data = parse(updateSchema, req.body);
    const current = await Coupon.findOne(lookup(req.params.idOrCode)).lean();
    if (!current) throw HttpError.notFound("Coupon not found.", "COUPON_NOT_FOUND");
    const type = data.type ?? current.type;
    const value = data.value ?? current.value;
    if (type === "percent" && value > 100) {
      throw HttpError.badRequest("A percent coupon can't be more than 100.", [{ path: "value", message: "Must be 100 or less." }], "VALIDATION_ERROR");
    }
    const updated = await Coupon.findByIdAndUpdate(current._id, toUpdate(data), { returnDocument: "after", runValidators: true }).lean();
    res.json({ coupon: view(updated!) });
  });

  router.delete("/:idOrCode", async (req, res) => {
    const deleted = await Coupon.findOneAndDelete(lookup(req.params.idOrCode));
    if (!deleted) throw HttpError.notFound("Coupon not found.", "COUPON_NOT_FOUND");
    res.status(204).end();
  });

  return router;
}
