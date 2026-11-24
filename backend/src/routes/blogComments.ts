import { Router } from "express";
import { z } from "zod";
import { emailSchema, parse, slugSchema } from "../lib/validation.js";
import { BlogComment } from "../models/BlogComment.js";

// "Leave a Reply" under the blog articles: anyone can send a comment, which is saved as pending
// (nothing is shown or emailed). The website field is optional; "example.com" is accepted and
// stored as "https://example.com".

const websiteSchema = z
  .string()
  .trim()
  .max(200, "Please enter a shorter website address.")
  .default("")
  .transform((value) => (value && !/^https?:\/\//i.test(value) ? `https://${value}` : value))
  .refine((value) => {
    if (!value) return true;
    try {
      return new URL(value).hostname.includes(".");
    } catch {
      return false;
    }
  }, "Please enter a valid website address.");

const commentSchema = z.object({
  postSlug: slugSchema,
  name: z.string().trim().min(1, "Please enter your name.").max(80, "Please use a shorter name."),
  email: emailSchema,
  website: websiteSchema,
  comment: z.string().trim().min(1, "Please write a comment.").max(3000, "Please keep your comment under 3000 characters."),
  /** A box the visitor never sees; only robots fill it in. */
  company: z.string().max(200).optional(),
});

export function blogCommentRoutes(): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const { company, ...fields } = parse(commentSchema, req.body);
    // A robot filled in the hidden box: answer as if it worked, but keep nothing.
    if (!company) await BlogComment.create(fields);
    res.status(201).json({ status: "pending", message: "Your comment is awaiting moderation." });
  });

  return router;
}
