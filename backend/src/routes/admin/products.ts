import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { HttpError } from "../../lib/httpError.js";
import { adminProduct, type ProductDoc } from "../../lib/serialize.js";
import { toUpdate } from "../../lib/updates.js";
import { escapeRegex, paginationSchema, parse, slugSchema } from "../../lib/validation.js";
import { Product } from "../../models/Product.js";
import { getSettings } from "../../models/Setting.js";
import type { StorefrontNotifier } from "../../services/storefront.js";

const image = z.object({
  url: z.string().trim().min(1).max(600),
  publicId: z.string().trim().max(300).optional(),
});

const position = z.number().int().min(0).default(0);
const categoryPlacement = z.object({ category: slugSchema, position });
const collectionPlacement = z.object({ key: slugSchema, position });

const productBase = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(200),
  sku: z.string().trim().max(60),
  price: z.number().min(0).max(1_000_000),
  regularPrice: z.number().min(0).max(1_000_000),
  image,
  hoverImage: image,
  rating: z.number().min(0).max(5),
  weight: z.string().trim().max(40),
  categories: z.array(categoryPlacement).max(20),
  collections: z.array(collectionPlacement).max(20),
  position: z.number().int().min(0),
  inStock: z.boolean(),
  /** How many are left. Leave it out (or send null) to not count stock. */
  stockQuantity: z.number().int().min(0).max(1_000_000),
  isActive: z.boolean(),
  // The product page content; its shape is owned by the storefront (productDetails.ts).
  details: z.record(z.string(), z.unknown()),
});

/** Creating: name, slug, price and main photo are needed; the rest is optional. */
const createSchema = productBase.partial().required({ slug: true, name: true, price: true, image: true });

/** Updating: any field; `null` clears an optional one. */
const nullable = <T extends z.ZodType>(schema: T) => schema.nullable();
const updateSchema = z
  .object({
    ...productBase.partial().shape,
    sku: nullable(productBase.shape.sku).optional(),
    regularPrice: nullable(productBase.shape.regularPrice).optional(),
    hoverImage: nullable(productBase.shape.hoverImage).optional(),
    rating: nullable(productBase.shape.rating).optional(),
    weight: nullable(productBase.shape.weight).optional(),
    stockQuantity: nullable(productBase.shape.stockQuantity).optional(),
    details: nullable(productBase.shape.details).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to change.");

const listQuery = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
  status: z.enum(["all", "active", "hidden"]).default("all"),
  category: slugSchema.optional(),
  /** Stock filter: counted-and-low uses Settings → low-stock threshold. */
  stock: z.enum(["all", "instock", "outofstock", "low"]).default("all"),
  sort: z.enum(["position", "name", "price", "stock", "date"]).default("position"),
  dir: z.enum(["asc", "desc"]).default("asc"),
});

/** A product with a stock count is in stock while the count is above zero; the count wins over the on/off switch. */
function withStockRules<T extends { stockQuantity?: number | null; inStock?: boolean }>(data: T): T {
  if (typeof data.stockQuantity === "number" && data.inStock === undefined) {
    return { ...data, inStock: data.stockQuantity > 0 };
  }
  return data;
}

function checkPrices(price: number | undefined, regularPrice: number | null | undefined) {
  if (price !== undefined && regularPrice != null && regularPrice < price) {
    throw HttpError.badRequest("The original price can't be lower than the selling price.", [{ path: "regularPrice", message: "Must be at least the price." }], "VALIDATION_ERROR");
  }
}

/** Accepts either the database id or the slug in the URL. */
const lookup = (idOrSlug: string) => (mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug });

export function adminProductRoutes(notifier: StorefrontNotifier): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const query = parse(listQuery, req.query);
    const filter: Record<string, unknown> = {};
    if (query.status !== "all") filter.isActive = query.status === "active";
    if (query.category) filter["categories.category"] = query.category;
    if (query.stock === "instock") filter.inStock = true;
    if (query.stock === "outofstock") filter.$and = [{ $or: [{ inStock: false }, { stockQuantity: 0 }] }];
    if (query.stock === "low") {
      const { lowStockThreshold } = await getSettings();
      filter.stockQuantity = { $gt: 0, $lte: lowStockThreshold };
    }
    if (query.search) {
      const pattern = { $regex: escapeRegex(query.search), $options: "i" };
      filter.$or = [{ name: pattern }, { slug: pattern }, { sku: pattern }];
    }
    const direction = query.dir === "desc" ? -1 : 1;
    const sort: Record<string, 1 | -1> =
      query.sort === "name"
        ? { name: direction }
        : query.sort === "price"
          ? { price: direction, name: 1 }
          : query.sort === "stock"
            ? { stockQuantity: direction, name: 1 }
            : query.sort === "date"
              ? { createdAt: direction }
              : { position: direction, name: 1 };
    const [items, total, all, published] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      Product.countDocuments(filter),
      Product.estimatedDocumentCount(),
      Product.countDocuments({ isActive: true }),
    ]);
    res.json({
      items: (items as ProductDoc[]).map(adminProduct),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.max(1, Math.ceil(total / query.limit)),
      // The numbers on the "All (25) | Published (24) | Hidden (1)" links ignore the other filters.
      counts: { all, active: published, hidden: all - published },
    });
  });

  router.get("/:idOrSlug", async (req, res) => {
    const product = (await Product.findOne(lookup(req.params.idOrSlug)).lean()) as ProductDoc | null;
    if (!product) throw HttpError.notFound("Product not found.", "PRODUCT_NOT_FOUND");
    res.json({ product: adminProduct(product) });
  });

  router.post("/", async (req, res) => {
    const data = parse(createSchema, req.body);
    checkPrices(data.price, data.regularPrice);
    const product = await Product.create(withStockRules(data));
    notifier.revalidate(["catalog"]);
    res.status(201).json({ product: adminProduct(product.toObject() as ProductDoc) });
  });

  router.patch("/:idOrSlug", async (req, res) => {
    const data = parse(updateSchema, req.body);
    const current = (await Product.findOne(lookup(req.params.idOrSlug)).lean()) as ProductDoc | null;
    if (!current) throw HttpError.notFound("Product not found.", "PRODUCT_NOT_FOUND");
    // Check the offer price against the price that will be in effect after this change.
    checkPrices(data.price ?? current.price, data.regularPrice === undefined ? current.regularPrice : data.regularPrice);

    const updated = (await Product.findByIdAndUpdate(current._id, toUpdate(withStockRules(data)), {
      returnDocument: "after",
      runValidators: true,
    }).lean()) as ProductDoc;
    notifier.revalidate(["catalog"]);
    res.json({ product: adminProduct(updated) });
  });

  router.delete("/:idOrSlug", async (req, res) => {
    const deleted = await Product.findOneAndDelete(lookup(req.params.idOrSlug));
    if (!deleted) throw HttpError.notFound("Product not found.", "PRODUCT_NOT_FOUND");
    notifier.revalidate(["catalog"]);
    res.status(204).end();
  });

  return router;
}
