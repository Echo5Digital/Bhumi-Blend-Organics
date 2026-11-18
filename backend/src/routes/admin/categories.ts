import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { HttpError } from "../../lib/httpError.js";
import { toUpdate } from "../../lib/updates.js";
import { parse, slugSchema } from "../../lib/validation.js";
import { Category } from "../../models/Category.js";
import { Product } from "../../models/Product.js";
import type { StorefrontNotifier } from "../../services/storefront.js";

const base = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500),
  position: z.number().int().min(0),
  isActive: z.boolean(),
});
const createSchema = base.partial().required({ slug: true, name: true });
const updateSchema = z
  .object({ ...base.partial().shape, description: base.shape.description.nullable().optional() })
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to change.");

const lookup = (idOrSlug: string) => (mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug });

const view = (category: { _id: unknown; slug: string; name: string; description?: string | null; position: number; isActive: boolean }) => ({
  id: String(category._id),
  slug: category.slug,
  name: category.name,
  description: category.description ?? undefined,
  position: category.position,
  isActive: category.isActive,
});

export function adminCategoryRoutes(notifier: StorefrontNotifier): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    const items = await Category.find().sort({ position: 1, name: 1 }).lean();
    res.json({ items: items.map(view) });
  });

  router.post("/", async (req, res) => {
    const category = await Category.create(parse(createSchema, req.body));
    notifier.revalidate(["catalog"]);
    res.status(201).json({ category: view(category.toObject()) });
  });

  router.patch("/:idOrSlug", async (req, res) => {
    const data = parse(updateSchema, req.body);
    const updated = await Category.findOneAndUpdate(lookup(req.params.idOrSlug), toUpdate(data), {
      returnDocument: "after",
      runValidators: true,
    }).lean();
    if (!updated) throw HttpError.notFound("Category not found.", "CATEGORY_NOT_FOUND");
    notifier.revalidate(["catalog"]);
    res.json({ category: view(updated) });
  });

  router.delete("/:idOrSlug", async (req, res) => {
    const deleted = await Category.findOneAndDelete(lookup(req.params.idOrSlug));
    if (!deleted) throw HttpError.notFound("Category not found.", "CATEGORY_NOT_FOUND");
    // Take it off the products too, so none points at a category that's gone.
    await Product.updateMany({}, { $pull: { categories: { category: deleted.slug } } });
    notifier.revalidate(["catalog"]);
    res.status(204).end();
  });

  return router;
}
