import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/httpError.js";
import { fromPaise, toPaise } from "../lib/money.js";
import { productCard, productDetail, type ProductDoc } from "../lib/serialize.js";
import { escapeRegex, parse, slugSchema } from "../lib/validation.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { getSettings } from "../models/Setting.js";
import { cartItemsSchema, evaluateCoupon, priceCart } from "../services/pricing.js";

// The public, read-only side of the shop: categories, products and coupon checks.

const listQuery = z.object({
  category: slugSchema.optional(),
  collection: slugSchema.optional(),
  search: z.string().trim().max(80).optional(),
  sort: z.enum(["default", "price-asc", "price-desc"]).default("default"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/** The product's place inside one named group (a category page or a home-page row). */
const positionIn = (field: "categories" | "collections", key: "category" | "key", value: string) => ({
  $first: {
    $map: {
      input: { $filter: { input: `$${field}`, cond: { $eq: [`$$this.${key}`, value] } } },
      as: "entry",
      in: "$$entry.position",
    },
  },
});

export function catalogRoutes(): Router {
  const router = Router();

  // The store's public details (name, contact, address), as set in the admin's Settings.
  // Empty strings mean "not filled in": the storefront then keeps its built-in text.
  router.get("/settings", async (_req, res) => {
    const settings = await getSettings();
    res.json({ storeName: settings.storeName, contactEmail: settings.contactEmail, contactPhone: settings.contactPhone, address: settings.address });
  });

  router.get("/categories", async (_req, res) => {
    const categories = await Category.find({ isActive: true }).sort({ position: 1, name: 1 }).lean();
    res.json({
      items: categories.map((category) => ({
        slug: category.slug,
        name: category.name,
        description: category.description ?? undefined,
        image: category.image?.url,
      })),
    });
  });

  // GET /api/products?category=hair&sort=price-asc&page=1&limit=9
  // Without a sort, products come in the order the storefront shows them: the
  // category's own order, the home-page row's order, or the main shop order.
  router.get("/products", async (req, res) => {
    const query = parse(listQuery, req.query);

    const match: Record<string, unknown> = { isActive: true };
    if (query.category) match["categories.category"] = query.category;
    if (query.collection) match["collections.key"] = query.collection;
    if (query.search) match.name = { $regex: escapeRegex(query.search), $options: "i" };

    const defaultOrder = query.category
      ? positionIn("categories", "category", query.category)
      : query.collection
        ? positionIn("collections", "key", query.collection)
        : "$position";
    const sort: Record<string, 1 | -1> =
      query.sort === "price-asc"
        ? { price: 1, position: 1 }
        : query.sort === "price-desc"
          ? { price: -1, position: 1 }
          : { _order: 1, position: 1 };

    const [result] = await Product.aggregate<{ items: ProductDoc[]; total: { n: number }[] }>([
      { $match: match },
      { $addFields: { _order: defaultOrder } },
      { $sort: sort },
      {
        $facet: {
          items: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }],
          total: [{ $count: "n" }],
        },
      },
    ]);

    const total = result?.total[0]?.n ?? 0;
    res.json({
      items: (result?.items ?? []).map(productCard),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.max(1, Math.ceil(total / query.limit)),
    });
  });

  router.get("/products/:slug", async (req, res) => {
    const product = (await Product.findOne({ slug: req.params.slug, isActive: true }).lean()) as ProductDoc | null;
    if (!product) throw HttpError.notFound("Product not found.", "PRODUCT_NOT_FOUND");

    // The page content names its related products and (for kits) its contents by slug.
    const details = (product.details ?? {}) as {
      relatedSlugs?: string[];
      bundle?: { slug: string; quantity: number }[];
    };
    const wanted = [...new Set([...(details.relatedSlugs ?? []), ...(details.bundle ?? []).map((item) => item.slug)])];
    const others = wanted.length
      ? ((await Product.find({ slug: { $in: wanted }, isActive: true }).lean()) as ProductDoc[])
      : [];
    const bySlug = new Map(others.map((item) => [item.slug, productCard(item)]));

    const related = (details.relatedSlugs ?? []).flatMap((slug) => bySlug.get(slug) ?? []);
    const bundle = (details.bundle ?? []).flatMap((item) => {
      const card = bySlug.get(item.slug);
      return card ? [{ product: card, quantity: item.quantity }] : [];
    });

    res.json(productDetail(product, related, bundle));
  });

  // POST /api/coupons/validate  { code, items: [{ slug, qty }] }
  // Tells the checkout what a coupon would take off, using the real prices.
  router.post("/coupons/validate", async (req, res) => {
    const body = parse(z.object({ code: z.string().trim().min(1).max(40), items: cartItemsSchema }), req.body);
    const cart = await priceCart(body.items);
    const coupon = await evaluateCoupon(body.code, cart.subtotal);
    res.json({
      code: coupon.code,
      description: coupon.description,
      discount: coupon.discount,
      subtotal: cart.subtotal,
      total: fromPaise(toPaise(cart.subtotal) - toPaise(coupon.discount)),
    });
  });

  return router;
}
