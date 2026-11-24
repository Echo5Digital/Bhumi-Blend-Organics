import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import type { Env } from "../config/env.js";
import { HttpError } from "../lib/httpError.js";
import { emailSchema, parse, slugSchema } from "../lib/validation.js";
import { createLimiter } from "../middleware/rateLimit.js";
import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";

// The reviews on a product page: anyone can read the approved ones and send a new one. A new review
// is saved as "pending" and shows nowhere on the website until an admin approves it.
//
//   GET  /api/products/:slug/reviews?own=<id>,<id>   approved reviews, newest first. `own` is the
//        ids this visitor sent earlier: the answer also says whether each is still pending, so the
//        page can keep showing "Your review is awaiting approval" only while that is true.
//   POST /api/products/:slug/reviews                  { rating?, review, name, email }

const newReviewSchema = z.object({
  /** 1 to 5 stars; 0 or left out means "no rating". */
  rating: z.number().int().min(0).max(5).optional(),
  review: z.string().trim().min(1, "Please write your review.").max(3000, "Please keep your review under 3000 characters."),
  name: z.string().trim().min(1, "Please enter your name.").max(80, "Please use a shorter name."),
  email: emailSchema,
  /** A box the visitor never sees; only robots fill it in. */
  company: z.string().max(200).optional(),
});

const readQuerySchema = z.object({ own: z.string().max(400).optional() });

export function reviewRoutes({ env }: { env: Pick<Env, "NODE_ENV"> }): Router {
  const router = Router({ mergeParams: true });
  const sendLimiter = createLimiter(env, { windowMinutes: 60, max: 8, message: "You have sent several reviews just now. Please try again a little later." });

  /** The slug in the address, once we know it belongs to a product on sale. */
  async function productSlug(raw: unknown): Promise<string> {
    const slug = parse(slugSchema, String(raw));
    if (!(await Product.exists({ slug, isActive: true }))) throw HttpError.notFound("Product not found.", "PRODUCT_NOT_FOUND");
    return slug;
  }

  // The product's slug comes from the address this router is mounted at (/products/:slug/reviews).
  const slugOf = (req: { params: unknown }) => (req.params as { slug?: string }).slug;

  router.get("/", async (req, res) => {
    const slug = await productSlug(slugOf(req));
    const { own } = parse(readQuerySchema, req.query);
    const ownIds = (own ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.isValidObjectId(id))
      .slice(0, 10);

    const [approved, mine] = await Promise.all([
      Review.find({ productSlug: slug, status: "approved" }).sort({ createdAt: -1 }).limit(100).lean(),
      ownIds.length ? Review.find({ _id: { $in: ownIds }, productSlug: slug }, { status: 1 }).lean() : Promise.resolve([]),
    ]);
    res.json({
      reviews: approved.map((item) => ({
        id: String(item._id),
        name: item.name,
        ...(item.rating != null && { rating: item.rating }),
        review: item.review,
        createdAt: item.createdAt,
      })),
      own: mine.map((item) => ({ id: String(item._id), status: item.status })),
    });
  });

  router.post("/", sendLimiter, async (req, res) => {
    const slug = await productSlug(slugOf(req));
    const { company, rating, ...fields } = parse(newReviewSchema, req.body);
    // A robot filled in the hidden box: answer as if it worked (with no id), but keep nothing.
    if (company) {
      res.status(201).json({ id: "", status: "pending", message: "Your review is awaiting approval." });
      return;
    }
    const created = await Review.create({ productSlug: slug, ...(rating ? { rating } : {}), ...fields });
    res.status(201).json({ id: String(created._id), status: "pending", message: "Your review is awaiting approval." });
  });

  return router;
}
