import { Schema, model, type InferSchemaType } from "mongoose";

// A message left through the "Leave a Reply" form under a blog article. Nothing is shown on the
// website: the shop owner reads them in the admin's Messages screen ("new" until marked as read).
const blogCommentSchema = new Schema(
  {
    /** The article it was written under: its address on the storefront, e.g. "how-to-age-gracefully-restore-rejuvenate-and-glow-naturally". */
    postSlug: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    /** Optional; empty when the visitor left it blank. */
    website: { type: String, trim: true, default: "" },
    comment: { type: String, required: true, trim: true },
    /** False until the admin marks it as read. */
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export type BlogCommentRecord = InferSchemaType<typeof blogCommentSchema>;
export const BlogComment = model("BlogComment", blogCommentSchema);
