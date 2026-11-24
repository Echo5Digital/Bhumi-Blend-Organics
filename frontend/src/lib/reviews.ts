import { api } from "./api";

// Product reviews: the approved ones for a product page, and sending a new one. A new review is
// saved as "pending" by the backend and shows on the website only after an admin approves it.

export type ReviewStatus = "pending" | "approved" | "rejected";

export type PublicReview = {
  id: string;
  name: string;
  /** 1 to 5; missing when the reviewer only wrote text. */
  rating?: number;
  review: string;
  createdAt: string;
};

/**
 * The approved reviews of a product (newest first). `ownIds` are the reviews this visitor sent
 * earlier: the answer says where each one stands, so "awaiting approval" is only shown while true.
 */
export function getProductReviews(slug: string, ownIds: string[] = []) {
  const query = ownIds.length > 0 ? `?own=${ownIds.map(encodeURIComponent).join(",")}` : "";
  return api<{ reviews: PublicReview[]; own: { id: string; status: ReviewStatus }[] }>(`/products/${encodeURIComponent(slug)}/reviews${query}`);
}

export type NewReview = {
  /** 1 to 5, or 0 for "no rating". */
  rating: number;
  review: string;
  name: string;
  email: string;
  /** A hidden box people never see: it must stay empty (robots fill it in). */
  company: string;
};

export function sendProductReview(slug: string, input: NewReview) {
  return api<{ id: string; status: "pending"; message: string }>(`/products/${encodeURIComponent(slug)}/reviews`, { method: "POST", body: input });
}
