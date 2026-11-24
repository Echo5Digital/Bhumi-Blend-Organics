import { Schema, model, type InferSchemaType } from "mongoose";

// A customer's review of a product ("Add a review" on the product page). New reviews wait in
// "pending"; only the ones an admin has approved are shown on the website.
const reviewSchema = new Schema(
  {
    /** The product it is about: its slug, e.g. "vitamin-c-face-serum". */
    productSlug: { type: String, required: true, trim: true },
    /** 1 to 5 stars; left out when the reviewer only wrote text. */
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    /** Never shown on the website: only the admin sees it. */
    email: { type: String, required: true, trim: true, lowercase: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  },
  { timestamps: true },
);

// The product page asks for "this product's approved reviews, newest first".
reviewSchema.index({ productSlug: 1, status: 1, createdAt: -1 });

export type ReviewRecord = InferSchemaType<typeof reviewSchema>;
export const Review = model("Review", reviewSchema);
