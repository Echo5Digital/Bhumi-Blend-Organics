import { z } from "zod";
import { HttpError } from "../lib/httpError.js";
import { fromPaise, toPaise } from "../lib/money.js";
import { Coupon } from "../models/Coupon.js";
import { Product } from "../models/Product.js";
import { getSettings } from "../models/Setting.js";

// Prices are always read from the database here — whatever price or total the
// browser shows is ignored, so nobody can buy at a price they edited.

/** Most of one product per order (same cap as the storefront's cart). */
export const MAX_QTY = 10;

export const cartItemsSchema = z
  .array(
    z.object({
      slug: z.string().trim().min(1).max(120),
      qty: z.number().int().min(1).max(MAX_QTY),
    }),
  )
  .min(1, "Your cart is empty.")
  .max(50);

export type CartItem = z.infer<typeof cartItemsSchema>[number];

export type PricedLine = {
  product: unknown;
  slug: string;
  name: string;
  image: string | undefined;
  size: string | undefined;
  unitPrice: number;
  regularPrice: number | undefined;
  qty: number;
  lineTotal: number;
};

export type PricedCart = {
  lines: PricedLine[];
  subtotal: number;
};

export async function priceCart(items: CartItem[]): Promise<PricedCart> {
  // Same product listed twice → one line.
  const qtyBySlug = new Map<string, number>();
  for (const item of items) qtyBySlug.set(item.slug, (qtyBySlug.get(item.slug) ?? 0) + item.qty);

  const tooMany = [...qtyBySlug].filter(([, qty]) => qty > MAX_QTY).map(([slug]) => slug);
  if (tooMany.length > 0) {
    throw HttpError.badRequest(`You can order at most ${MAX_QTY} of one product.`, { slugs: tooMany }, "QTY_TOO_HIGH");
  }

  const products = await Product.find({ slug: { $in: [...qtyBySlug.keys()] }, isActive: true }).lean();
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const missing = [...qtyBySlug.keys()].filter((slug) => !bySlug.has(slug));
  if (missing.length > 0) {
    throw HttpError.badRequest("Some products in your cart are no longer available.", { slugs: missing }, "PRODUCT_UNAVAILABLE");
  }
  const soldOut = products
    .filter((product) => product.inStock === false || product.stockQuantity === 0)
    .map((product) => product.slug);
  if (soldOut.length > 0) {
    throw HttpError.conflict("Some products in your cart are out of stock.", "OUT_OF_STOCK");
  }
  // A product with a stock count can't be ordered beyond what is left.
  for (const product of products) {
    const wanted = qtyBySlug.get(product.slug) ?? 0;
    if (typeof product.stockQuantity === "number" && product.stockQuantity < wanted) {
      throw HttpError.conflict(
        `Only ${product.stockQuantity} of ${product.name} ${product.stockQuantity === 1 ? "is" : "are"} left.`,
        "INSUFFICIENT_STOCK",
      );
    }
  }

  let subtotalPaise = 0;
  const lines: PricedLine[] = [];
  for (const [slug, qty] of qtyBySlug) {
    const product = bySlug.get(slug)!;
    const linePaise = toPaise(product.price) * qty;
    subtotalPaise += linePaise;
    lines.push({
      product: product._id,
      slug,
      name: product.name,
      image: product.image?.url,
      size: product.weight ?? undefined,
      unitPrice: product.price,
      regularPrice: product.regularPrice ?? undefined,
      qty,
      lineTotal: fromPaise(linePaise),
    });
  }
  return { lines, subtotal: fromPaise(subtotalPaise) };
}

export type AppliedCoupon = { code: string; description?: string; discount: number };

/** Check a coupon code against a cart total; returns the discount or throws a 400 saying why not. */
export async function evaluateCoupon(rawCode: string, subtotal: number, now = new Date()): Promise<AppliedCoupon> {
  if (!(await getSettings()).couponsEnabled) {
    throw HttpError.badRequest("Coupons are not being accepted at the moment.", undefined, "COUPONS_DISABLED");
  }
  const code = rawCode.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code, isActive: true }).lean();
  if (!coupon) {
    throw HttpError.badRequest(`Coupon "${rawCode.trim()}" does not exist.`, undefined, "COUPON_INVALID");
  }
  if (coupon.startsAt && coupon.startsAt > now) {
    throw HttpError.badRequest("This coupon isn't active yet.", undefined, "COUPON_NOT_STARTED");
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw HttpError.badRequest("This coupon has expired.", undefined, "COUPON_EXPIRED");
  }
  if (coupon.usageLimit !== undefined && coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw HttpError.badRequest("This coupon has been used up.", undefined, "COUPON_USED_UP");
  }
  const minPaise = toPaise(coupon.minSubtotal ?? 0);
  const subtotalPaise = toPaise(subtotal);
  if (subtotalPaise < minPaise) {
    throw HttpError.badRequest(
      `Add ₹${fromPaise(minPaise - subtotalPaise).toFixed(2)} more to use this coupon.`,
      { minSubtotal: coupon.minSubtotal },
      "COUPON_MIN_SUBTOTAL",
    );
  }

  let discountPaise =
    coupon.type === "percent" ? Math.floor((subtotalPaise * coupon.value) / 100) : toPaise(coupon.value);
  if (coupon.type === "percent" && coupon.maxDiscount) discountPaise = Math.min(discountPaise, toPaise(coupon.maxDiscount));
  discountPaise = Math.min(discountPaise, subtotalPaise);

  return { code: coupon.code, description: coupon.description ?? undefined, discount: fromPaise(discountPaise) };
}
