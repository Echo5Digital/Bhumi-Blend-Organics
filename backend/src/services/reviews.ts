import { Review } from "../models/Review.js";

// A product page's star rating. The live site's old ratings (a number of stars and how many people
// gave them, kept in the product's page content) stay as they are; reviews approved on this website
// are added on top, so "Rated 4.33 out of 5 based on 3 customer reviews" counts both.

export type RatingSummary = { value: number; count: number };

/** What the approved reviews of one product add up to: how many, how many gave stars, and those stars together. */
export type ReviewTotals = { count: number; rated: number; sum: number };

/** The old rating and the approved reviews together (the average counts only the people who gave stars). */
export function combineRating(legacy: Partial<RatingSummary> | null | undefined, totals: ReviewTotals): RatingSummary {
  const legacyCount = Math.max(0, Math.round(legacy?.count ?? 0));
  const legacyValue = legacy?.value ?? 0;
  const legacyRated = legacyValue > 0 ? legacyCount : 0;
  const rated = legacyRated + totals.rated;
  const average = rated > 0 ? (legacyValue * legacyRated + totals.sum) / rated : 0;
  return { value: Math.round(average * 100) / 100, count: legacyCount + totals.count };
}

/** The approved reviews of a product, added up; null when there are none. */
export async function approvedTotals(productSlug: string): Promise<ReviewTotals | null> {
  const [row] = await Review.aggregate<ReviewTotals>([
    { $match: { productSlug, status: "approved" } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        rated: { $sum: { $cond: [{ $gt: ["$rating", 0] }, 1, 0] } },
        sum: { $sum: { $ifNull: ["$rating", 0] } },
      },
    },
  ]);
  return row && row.count > 0 ? { count: row.count, rated: row.rated, sum: row.sum } : null;
}
