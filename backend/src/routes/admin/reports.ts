import { Router } from "express";
import { z } from "zod";
import { IST_ZONE, dayString, eachDay, startOfDay, startOfNextDay, todayInIst } from "../../lib/dates.js";
import { HttpError } from "../../lib/httpError.js";
import { parse } from "../../lib/validation.js";
import { Category } from "../../models/Category.js";
import { Customer } from "../../models/Customer.js";
import { Order } from "../../models/Order.js";
import { Product } from "../../models/Product.js";
import { getSettings } from "../../models/Setting.js";

// The admin's Reports screen. Every report takes a date range (`from` / `to`, as
// YYYY-MM-DD, inclusive, in Indian time); with none it means "this month so far".
//
// "Sales" count orders that are paid and not cancelled. A refunded order is
// reported separately as a refund and taken off the net figure.

const rangeQuery = z.object({ from: dayString.optional(), to: dayString.optional() });

const round2 = (value: number) => Math.round(value * 100) / 100;

function resolveRange(query: unknown) {
  const { from: rawFrom, to: rawTo } = parse(rangeQuery, query);
  const to = rawTo ?? todayInIst();
  const from = rawFrom ?? `${to.slice(0, 8)}01`;
  if (from > to) throw HttpError.badRequest("The start date is after the end date.", undefined, "INVALID_RANGE");
  const days = eachDay(from, to);
  if (days.length > 366) throw HttpError.badRequest("Choose a range of one year or less.", undefined, "RANGE_TOO_LONG");
  return { from, to, days, start: startOfDay(from), end: startOfNextDay(to) };
}

/** Paid, not cancelled, placed inside the range. */
const counted = (range: { start: Date; end: Date }) => ({
  createdAt: { $gte: range.start, $lt: range.end },
  paymentStatus: "paid",
  fulfilmentStatus: { $ne: "cancelled" },
});

const dayOf = (field: string, format: string) => ({ $dateToString: { format, date: field, timezone: IST_ZONE } });

export function adminReportRoutes(): Router {
  const router = Router();

  // Sales by date: the totals and a chart series (per day, or per month for long ranges).
  router.get("/sales", async (req, res) => {
    const range = resolveRange(req.query);
    const monthly = range.days.length > 92;
    const format = monthly ? "%Y-%m" : "%Y-%m-%d";
    const keys = monthly ? [...new Set(range.days.map((day) => day.slice(0, 7)))] : range.days;

    const [sold, refunded] = await Promise.all([
      Order.aggregate<{ _id: string; gross: number; discounts: number; shipping: number; orders: number; items: number }>([
        { $match: counted(range) },
        {
          $group: {
            _id: dayOf("$createdAt", format),
            gross: { $sum: "$subtotal" },
            discounts: { $sum: "$discountTotal" },
            shipping: { $sum: "$shippingTotal" },
            orders: { $sum: 1 },
            items: { $sum: { $sum: "$items.qty" } },
          },
        },
      ]),
      Order.aggregate<{ _id: string; count: number; amount: number }>([
        { $match: { createdAt: { $gte: range.start, $lt: range.end }, paymentStatus: "refunded" } },
        { $group: { _id: dayOf("$createdAt", format), count: { $sum: 1 }, amount: { $sum: "$total" } } },
      ]),
    ]);

    const soldBy = new Map(sold.map((row) => [row._id, row]));
    const refundedBy = new Map(refunded.map((row) => [row._id, row]));
    const series = keys.map((key) => {
      const s = soldBy.get(key);
      const gross = s?.gross ?? 0;
      return {
        date: key,
        grossSales: round2(gross),
        netSales: round2(gross - (s?.discounts ?? 0) - (refundedBy.get(key)?.amount ?? 0)),
        orders: s?.orders ?? 0,
      };
    });

    const sum = <K extends "gross" | "discounts" | "shipping" | "orders" | "items">(key: K) => sold.reduce((total, row) => total + row[key], 0);
    const grossSales = sum("gross");
    const refundAmount = refunded.reduce((total, row) => total + row.amount, 0);
    const orders = sum("orders");

    res.json({
      from: range.from,
      to: range.to,
      groupBy: monthly ? "month" : "day",
      summary: {
        grossSales: round2(grossSales),
        netSales: round2(grossSales - sum("discounts") - refundAmount),
        orders,
        items: sum("items"),
        refunds: { count: refunded.reduce((total, row) => total + row.count, 0), amount: round2(refundAmount) },
        shipping: round2(sum("shipping")),
        couponDiscounts: round2(sum("discounts")),
        averageGrossPerDay: round2(grossSales / range.days.length),
        averageOrdersPerDay: round2(orders / range.days.length),
      },
      series,
    });
  });

  // Sales by product: what sold best in the range.
  router.get("/products", async (req, res) => {
    const range = resolveRange(req.query);
    const rows = await Order.aggregate<{ _id: string; name: string; qty: number; revenue: number }>([
      { $match: counted(range) },
      { $unwind: "$items" },
      { $group: { _id: "$items.slug", name: { $last: "$items.name" }, qty: { $sum: "$items.qty" }, revenue: { $sum: "$items.lineTotal" } } },
      { $sort: { revenue: -1, qty: -1 } },
      { $limit: 50 },
    ]);
    res.json({
      from: range.from,
      to: range.to,
      items: rows.map((row) => ({ slug: row._id, name: row.name, quantity: row.qty, revenue: round2(row.revenue) })),
    });
  });

  // Sales by category. A product in two categories counts toward both.
  router.get("/categories", async (req, res) => {
    const range = resolveRange(req.query);
    const [rows, categories] = await Promise.all([
      Order.aggregate<{ _id: string; qty: number; revenue: number }>([
        { $match: counted(range) },
        { $unwind: "$items" },
        { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            qty: "$items.qty",
            revenue: "$items.lineTotal",
            categories: {
              $cond: [{ $gt: [{ $size: { $ifNull: ["$product.categories", []] } }, 0] }, "$product.categories.category", ["uncategorised"]],
            },
          },
        },
        { $unwind: "$categories" },
        { $group: { _id: "$categories", qty: { $sum: "$qty" }, revenue: { $sum: "$revenue" } } },
        { $sort: { revenue: -1 } },
      ]),
      Category.find().lean(),
    ]);
    const names = new Map(categories.map((category) => [category.slug, category.name]));
    res.json({
      from: range.from,
      to: range.to,
      items: rows.map((row) => ({
        slug: row._id,
        name: row._id === "uncategorised" ? "Uncategorised" : (names.get(row._id) ?? row._id),
        quantity: row.qty,
        revenue: round2(row.revenue),
      })),
    });
  });

  // Coupons: how often each code was used and what it took off.
  router.get("/coupons", async (req, res) => {
    const range = resolveRange(req.query);
    const withCoupon = { ...counted(range), "coupon.code": { $exists: true, $nin: [null, ""] } };
    const [rows, byDay] = await Promise.all([
      Order.aggregate<{ _id: string; orders: number; discount: number }>([
        { $match: withCoupon },
        { $group: { _id: "$coupon.code", orders: { $sum: 1 }, discount: { $sum: "$discountTotal" } } },
        { $sort: { discount: -1 } },
      ]),
      Order.aggregate<{ _id: string; discount: number }>([
        { $match: withCoupon },
        { $group: { _id: dayOf("$createdAt", "%Y-%m-%d"), discount: { $sum: "$discountTotal" } } },
      ]),
    ]);
    const discountBy = new Map(byDay.map((row) => [row._id, row.discount]));
    res.json({
      from: range.from,
      to: range.to,
      summary: {
        ordersWithCoupon: rows.reduce((total, row) => total + row.orders, 0),
        totalDiscount: round2(rows.reduce((total, row) => total + row.discount, 0)),
      },
      items: rows.map((row) => ({ code: row._id, orders: row.orders, discount: round2(row.discount) })),
      series: range.days.length > 92 ? [] : range.days.map((date) => ({ date, discount: round2(discountBy.get(date) ?? 0) })),
    });
  });

  // Customers: sign-ups over time, and how much of the business is accounts vs guests.
  router.get("/customers", async (req, res) => {
    const range = resolveRange(req.query);
    const [registered, signups, orders] = await Promise.all([
      Customer.estimatedDocumentCount(),
      Customer.aggregate<{ _id: string; count: number }>([
        { $match: { createdAt: { $gte: range.start, $lt: range.end } } },
        { $group: { _id: dayOf("$createdAt", "%Y-%m-%d"), count: { $sum: 1 } } },
      ]),
      Order.aggregate<{ _id: boolean; orders: number; revenue: number }>([
        { $match: counted(range) },
        { $group: { _id: { $ne: [{ $ifNull: ["$customer", null] }, null] }, orders: { $sum: 1 }, revenue: { $sum: "$total" } } },
      ]),
    ]);
    const signupBy = new Map(signups.map((row) => [row._id, row.count]));
    const from = (isAccount: boolean) => orders.find((row) => row._id === isAccount);
    res.json({
      from: range.from,
      to: range.to,
      summary: {
        registeredCustomers: registered,
        newCustomers: signups.reduce((total, row) => total + row.count, 0),
        ordersFromAccounts: from(true)?.orders ?? 0,
        ordersFromGuests: from(false)?.orders ?? 0,
        revenueFromAccounts: round2(from(true)?.revenue ?? 0),
        revenueFromGuests: round2(from(false)?.revenue ?? 0),
      },
      series: range.days.length > 92 ? [] : range.days.map((date) => ({ date, newCustomers: signupBy.get(date) ?? 0 })),
    });
  });

  // Stock: what's low, what's gone, and what there's most of. Only products with a stock count are listed
  // as "low" or "most"; a product switched to "out of stock" by hand shows under "out".
  router.get("/stock", async (_req, res) => {
    const { lowStockThreshold } = await getSettings();
    // visible products only
    const active = (extra: Record<string, unknown>): Record<string, unknown> => ({ isActive: true, ...extra });
    const card = (product: { slug: string; name: string; sku?: string | null; stockQuantity?: number | null; inStock: boolean }) => ({
      slug: product.slug,
      name: product.name,
      sku: product.sku ?? undefined,
      stockQuantity: product.stockQuantity ?? undefined,
      inStock: product.inStock,
    });
    const [low, out, most, counted] = await Promise.all([
      Product.find(active({ stockQuantity: { $gt: 0, $lte: lowStockThreshold } })).sort({ stockQuantity: 1, name: 1 }).limit(100).lean(),
      Product.find(active({ $or: [{ inStock: false }, { stockQuantity: 0 }] })).sort({ name: 1 }).limit(100).lean(),
      Product.find(active({ stockQuantity: { $gt: 0 } })).sort({ stockQuantity: -1, name: 1 }).limit(20).lean(),
      Product.countDocuments(active({ stockQuantity: { $type: "number" } })),
    ]);
    res.json({
      lowStockThreshold,
      productsWithStockCount: counted,
      low: low.map(card),
      out: out.map(card),
      most: most.map(card),
    });
  });

  return router;
}
