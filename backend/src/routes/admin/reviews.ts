import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { HttpError } from "../../lib/httpError.js";
import { escapeRegex, paginationSchema, parse } from "../../lib/validation.js";
import { Product } from "../../models/Product.js";
import { Review } from "../../models/Review.js";
import type { StorefrontNotifier } from "../../services/storefront.js";

// The admin's "Reviews" screen: every review customers have sent, to approve (then it shows on the
// product page), reject or delete. Each change tells the storefront to refresh, because a product
// page's star rating counts the approved reviews.

const STATUSES = ["pending", "approved", "rejected"] as const;

const listQuery = paginationSchema.extend({
  status: z.enum(["all", ...STATUSES]).default("all"),
  search: z.string().trim().max(80).optional(),
});
const statusBody = z.object({ status: z.enum(STATUSES) });
const objectId = z.string().refine((id) => mongoose.isValidObjectId(id), "Not a valid review id.");
const bulkBody = z.object({ ids: z.array(objectId).min(1).max(100), action: z.enum(["approve", "reject", "delete"]) });

type ReviewView = {
  _id: unknown;
  productSlug: string;
  rating?: number | null;
  review: string;
  name: string;
  email: string;
  status: string;
  createdAt?: Date;
};

export function adminReviewRoutes(notifier: StorefrontNotifier): Router {
  const router = Router();

  const view = (item: ReviewView, productName: string | undefined) => ({
    id: String(item._id),
    productSlug: item.productSlug,
    productName: productName ?? item.productSlug,
    ...(item.rating != null && { rating: item.rating }),
    review: item.review,
    name: item.name,
    email: item.email,
    status: item.status,
    createdAt: item.createdAt,
  });

  router.get("/", async (req, res) => {
    const query = parse(listQuery, req.query);

    const match: Record<string, unknown> = {};
    if (query.status !== "all") match.status = query.status;
    if (query.search) {
      const pattern = { $regex: escapeRegex(query.search), $options: "i" };
      match.$or = [{ name: pattern }, { email: pattern }, { review: pattern }, { productSlug: pattern }];
    }

    const [items, total, grouped] = await Promise.all([
      Review.find(match)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      Review.countDocuments(match),
      Review.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ]);

    const names = new Map(
      (await Product.find({ slug: { $in: [...new Set(items.map((item) => item.productSlug))] } }, { slug: 1, name: 1 }).lean()).map((product) => [product.slug, product.name]),
    );
    const counts = { all: 0, pending: 0, approved: 0, rejected: 0 };
    for (const row of grouped) {
      if (row._id in counts) counts[row._id as (typeof STATUSES)[number]] = row.n;
      counts.all += row.n;
    }

    res.json({
      items: items.map((item) => view(item, names.get(item.productSlug))),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.max(1, Math.ceil(total / query.limit)),
      counts,
    });
  });

  router.patch("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw HttpError.notFound("Review not found.", "REVIEW_NOT_FOUND");
    const { status } = parse(statusBody, req.body);
    const updated = await Review.findByIdAndUpdate(req.params.id, { status }, { returnDocument: "after" }).lean();
    if (!updated) throw HttpError.notFound("Review not found.", "REVIEW_NOT_FOUND");
    notifier.revalidate(["catalog"]);
    const product = await Product.findOne({ slug: updated.productSlug }, { name: 1 }).lean();
    res.json({ review: view(updated, product?.name) });
  });

  router.delete("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw HttpError.notFound("Review not found.", "REVIEW_NOT_FOUND");
    const deleted = await Review.findByIdAndDelete(req.params.id);
    if (!deleted) throw HttpError.notFound("Review not found.", "REVIEW_NOT_FOUND");
    notifier.revalidate(["catalog"]);
    res.status(204).end();
  });

  // Approve, reject or delete several reviews at once.
  router.post("/bulk", async (req, res) => {
    const { ids, action } = parse(bulkBody, req.body);
    let changed: number;
    if (action === "delete") {
      changed = (await Review.deleteMany({ _id: { $in: ids } })).deletedCount;
    } else {
      changed = (await Review.updateMany({ _id: { $in: ids } }, { status: action === "approve" ? "approved" : "rejected" })).matchedCount;
    }
    if (changed > 0) notifier.revalidate(["catalog"]);
    res.json({ updated: changed });
  });

  return router;
}
