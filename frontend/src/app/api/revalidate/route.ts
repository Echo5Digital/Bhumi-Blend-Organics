import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

// POST /api/revalidate  { "tags": ["catalog", "settings"] }
//
// The backend calls this after an admin changes a product, category or setting
// (or an order changes a stock count). It drops the cached copies of what the
// shop shows, so the next page load fetches the new data.
//   "catalog"  — products, categories, prices, stock
//   "settings" — the store's contact details
//
// Protected by a secret both sides know (REVALIDATE_SECRET): anyone else gets a
// 401, and with no secret set here nothing is accepted at all.

const ALLOWED = new Set(["catalog", "settings"]);

function sameSecret(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ") || !sameSecret(header.slice(7), secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? [...new Set(body.tags.filter((tag): tag is string => typeof tag === "string" && ALLOWED.has(tag)))] : [];
  // { expire: 0 }: nobody is served the old copy — the next visit builds the new one at once.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return Response.json({ revalidated: tags });
}
