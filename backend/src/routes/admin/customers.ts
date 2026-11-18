import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { HttpError } from "../../lib/httpError.js";
import { deriveStatus } from "../../lib/orderStatus.js";
import { publicCustomer, type CustomerDoc, type OrderDoc } from "../../lib/serialize.js";
import { paginationSchema, parse } from "../../lib/validation.js";
import { Customer } from "../../models/Customer.js";
import { Order } from "../../models/Order.js";

// The admin's Customers screen: people with an account ("registered") and people
// who only ever checked out as a guest, each with what they've bought.
//
// Spend and order counts include paid orders only (not pending, cancelled or
// refunded ones). Guests are grouped by email address.

const listQuery = paginationSchema.extend({
  type: z.enum(["all", "registered", "guests"]).default("all"),
  search: z.string().trim().max(80).optional(),
  sort: z.enum(["lastActive", "name", "orders", "spend", "registered"]).default("lastActive"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(5000).default(25),
});

type CustomerRow = {
  /** Present for registered customers only. */
  id?: string;
  type: "registered" | "guest";
  name: string;
  email: string;
  registeredAt?: Date;
  lastActive?: Date;
  orders: number;
  totalSpend: number;
  averageOrderValue: number;
  country?: string;
  city?: string;
  state?: string;
  postcode?: string;
};

type Stats = {
  _id: unknown;
  customer?: mongoose.Types.ObjectId | null;
  email: string;
  orders: number;
  spend: number;
  lastOrderAt: Date;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  pin?: string;
  country?: string;
};

const later = (a?: Date, b?: Date) => (a && b ? (a > b ? a : b) : (a ?? b));
const round2 = (value: number) => Math.round(value * 100) / 100;

async function orderStats(): Promise<Stats[]> {
  return Order.aggregate<Stats>([
    { $match: { paymentStatus: "paid", fulfilmentStatus: { $ne: "cancelled" } } },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        // registered customers by account, guests by email
        _id: { $ifNull: ["$customer", "$email"] },
        customer: { $first: "$customer" },
        email: { $last: "$email" },
        orders: { $sum: 1 },
        spend: { $sum: "$total" },
        lastOrderAt: { $max: "$createdAt" },
        firstName: { $last: "$shipping.firstName" },
        lastName: { $last: "$shipping.lastName" },
        city: { $last: "$shipping.city" },
        state: { $last: "$shipping.state" },
        pin: { $last: "$shipping.pin" },
        country: { $last: "$shipping.country" },
      },
    },
  ]);
}

export function adminCustomerRoutes(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const query = parse(listQuery, req.query);
    const stats = await orderStats();
    const byCustomer = new Map(stats.filter((entry) => entry.customer).map((entry) => [String(entry.customer), entry]));

    const rows: CustomerRow[] = [];

    if (query.type !== "guests") {
      const customers = await Customer.find().lean();
      for (const customer of customers) {
        const entry = byCustomer.get(String(customer._id));
        const shipping = customer.addresses?.shipping;
        const orders = entry?.orders ?? 0;
        const totalSpend = round2(entry?.spend ?? 0);
        rows.push({
          id: String(customer._id),
          type: "registered",
          name: `${customer.firstName} ${customer.lastName}`.trim(),
          email: customer.email,
          registeredAt: (customer as { createdAt?: Date }).createdAt,
          lastActive: later(customer.lastLoginAt ?? undefined, entry?.lastOrderAt),
          orders,
          totalSpend,
          averageOrderValue: orders > 0 ? round2(totalSpend / orders) : 0,
          country: shipping?.country ?? entry?.country,
          city: shipping?.city ?? entry?.city,
          state: shipping?.state ?? entry?.state,
          postcode: shipping?.pin ?? entry?.pin,
        });
      }
    }

    if (query.type !== "registered") {
      for (const entry of stats.filter((item) => !item.customer)) {
        const totalSpend = round2(entry.spend);
        rows.push({
          type: "guest",
          name: `${entry.firstName ?? ""} ${entry.lastName ?? ""}`.trim(),
          email: entry.email,
          lastActive: entry.lastOrderAt,
          orders: entry.orders,
          totalSpend,
          averageOrderValue: round2(totalSpend / entry.orders),
          country: entry.country,
          city: entry.city,
          state: entry.state,
          postcode: entry.pin,
        });
      }
    }

    const search = query.search?.toLowerCase();
    const visible = search ? rows.filter((row) => row.name.toLowerCase().includes(search) || row.email.toLowerCase().includes(search)) : rows;

    const sign = query.dir === "asc" ? 1 : -1;
    const time = (date?: Date) => (date ? date.getTime() : 0);
    visible.sort((a, b) => {
      switch (query.sort) {
        case "name":
          return sign * a.name.localeCompare(b.name);
        case "orders":
          return sign * (a.orders - b.orders);
        case "spend":
          return sign * (a.totalSpend - b.totalSpend);
        case "registered":
          return sign * (time(a.registeredAt) - time(b.registeredAt));
        default:
          return sign * (time(a.lastActive) - time(b.lastActive));
      }
    });

    const start = (query.page - 1) * query.limit;
    res.json({
      items: visible.slice(start, start + query.limit),
      page: query.page,
      limit: query.limit,
      total: visible.length,
      pages: Math.max(1, Math.ceil(visible.length / query.limit)),
    });
  });

  // One registered customer: their details, what they've spent and their recent orders.
  router.get("/:id", async (req, res) => {
    const customer = mongoose.isValidObjectId(req.params.id) ? await Customer.findById(req.params.id).lean() : null;
    if (!customer) throw HttpError.notFound("Customer not found.", "CUSTOMER_NOT_FOUND");

    const orders = (await Order.find({ customer: customer._id }).sort({ createdAt: -1 }).limit(50).lean()) as unknown as OrderDoc[];
    const paid = orders.filter((order) => order.paymentStatus === "paid" && order.fulfilmentStatus !== "cancelled");
    const totalSpend = round2(paid.reduce((sum, order) => sum + order.total, 0));

    res.json({
      customer: {
        ...publicCustomer(customer as unknown as CustomerDoc),
        isActive: customer.isActive,
        emailVerified: Boolean(customer.emailVerifiedAt),
        registeredAt: (customer as { createdAt?: Date }).createdAt,
        lastLoginAt: customer.lastLoginAt ?? undefined,
      },
      stats: { orders: paid.length, totalSpend, averageOrderValue: paid.length > 0 ? round2(totalSpend / paid.length) : 0 },
      orders: orders.map((order) => ({
        number: order.number,
        createdAt: order.createdAt,
        status: deriveStatus(order),
        total: order.total,
        itemCount: order.items.reduce((sum, item) => sum + item.qty, 0),
      })),
    });
  });

  // Switch an account off (they can't log in) or back on. Their orders stay.
  router.patch("/:id", async (req, res) => {
    const { isActive } = parse(z.object({ isActive: z.boolean() }), req.body);
    const updated = mongoose.isValidObjectId(req.params.id)
      ? await Customer.findByIdAndUpdate(req.params.id, { $set: { isActive } }, { returnDocument: "after" }).lean()
      : null;
    if (!updated) throw HttpError.notFound("Customer not found.", "CUSTOMER_NOT_FOUND");
    res.json({ customer: { id: String(updated._id), isActive: updated.isActive } });
  });

  return router;
}
