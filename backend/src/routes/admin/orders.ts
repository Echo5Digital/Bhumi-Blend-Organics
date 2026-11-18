import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { dayString, startOfDay, startOfNextDay } from "../../lib/dates.js";
import { HttpError } from "../../lib/httpError.js";
import { ADMIN_TARGET_STATUSES, ORDER_STATUSES, STATUS_FILTERS, deriveStatus } from "../../lib/orderStatus.js";
import { adminOrder, type OrderDoc } from "../../lib/serialize.js";
import { escapeRegex, paginationSchema, parse } from "../../lib/validation.js";
import { Order } from "../../models/Order.js";
import { addNote, changeOrderStatus } from "../../services/orderAdmin.js";
import type { StorefrontNotifier } from "../../services/storefront.js";

// The admin's Orders screen: status tabs with counts, filters, one order's page,
// status changes, notes and bulk actions.

const listQuery = paginationSchema.extend({
  status: z.enum(["all", ...ORDER_STATUSES]).default("all"),
  /** An order number ("#20001"), part of an email address, or part of the customer's name. */
  search: z.string().trim().max(80).optional(),
  /** Only orders from this registered customer (their id). */
  customer: z.string().refine((value) => mongoose.isValidObjectId(value), "That id is not valid.").optional(),
  from: dayString.optional(),
  to: dayString.optional(),
  sort: z.enum(["date", "total", "number"]).default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

const updateSchema = z
  .object({
    status: z.enum(ADMIN_TARGET_STATUSES),
    tracking: z.object({
      carrier: z.string().trim().max(80).optional(),
      trackingNumber: z.string().trim().min(1).max(80),
    }),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Send at least one field to change.");

const noteSchema = z.object({
  text: z.string().trim().min(1, "Write a note first.").max(2000),
  /** true = the customer can see it on their order page. */
  customerNote: z.boolean().default(false),
});

const bulkSchema = z.object({
  numbers: z.array(z.number().int()).min(1).max(100),
  status: z.enum(ADMIN_TARGET_STATUSES),
});

async function findByNumber(raw: string) {
  const number = Number(raw);
  const order = Number.isInteger(number) ? await Order.findOne({ number }) : null;
  if (!order) throw HttpError.notFound("Order not found.", "ORDER_NOT_FOUND");
  return order;
}

/** One line of the orders table. */
function row(order: OrderDoc) {
  return {
    number: order.number,
    createdAt: order.createdAt,
    status: deriveStatus(order),
    total: order.total,
    currency: order.currency,
    customerName: `${order.shipping.firstName} ${order.shipping.lastName}`.trim(),
    email: order.email,
    customerId: order.customer ? String(order.customer) : undefined,
    itemCount: order.items.reduce((sum, item) => sum + item.qty, 0),
    items: order.items.map((item) => ({ name: item.name, qty: item.qty })),
  };
}

export function adminOrderRoutes(notifier: StorefrontNotifier): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const query = parse(listQuery, req.query);

    const and: Record<string, unknown>[] = [];
    if (query.status !== "all") and.push(STATUS_FILTERS[query.status]);
    if (query.customer) and.push({ customer: new mongoose.Types.ObjectId(query.customer) });
    if (query.from || query.to) {
      and.push({
        createdAt: {
          ...(query.from && { $gte: startOfDay(query.from) }),
          ...(query.to && { $lt: startOfNextDay(query.to) }),
        },
      });
    }
    if (query.search) {
      const term = query.search.replace(/^#/, "");
      const asNumber = Number(term);
      const pattern = { $regex: escapeRegex(query.search), $options: "i" };
      and.push({
        $or: [
          ...(Number.isInteger(asNumber) && term !== "" ? [{ number: asNumber }] : []),
          { email: pattern },
          { "shipping.firstName": pattern },
          { "shipping.lastName": pattern },
        ],
      });
    }
    const filter = and.length > 0 ? { $and: and } : {};

    const sortField = query.sort === "total" ? "total" : query.sort === "number" ? "number" : "createdAt";
    const direction = query.dir === "asc" ? 1 : -1;

    const [items, total, ...tabCounts] = await Promise.all([
      Order.find(filter)
        .sort({ [sortField]: direction })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      Order.countDocuments(filter),
      Order.estimatedDocumentCount(),
      ...ORDER_STATUSES.map((status) => Order.countDocuments(STATUS_FILTERS[status])),
    ]);

    res.json({
      items: (items as unknown as OrderDoc[]).map(row),
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.max(1, Math.ceil(total / query.limit)),
      // The numbers on the status tabs ("All (20) | Processing (3) | ...") ignore the other filters.
      counts: { all: tabCounts[0], ...Object.fromEntries(ORDER_STATUSES.map((status, index) => [status, tabCounts[index + 1]])) },
    });
  });

  // Several orders to the same status at once (the "Bulk actions" menu). An order that
  // can't make the change is skipped and reported, the rest still go through.
  router.post("/bulk", async (req, res) => {
    const { numbers, status } = parse(bulkSchema, req.body);
    const orders = await Order.find({ number: { $in: numbers } });
    const adminName = res.locals.admin.name as string;

    let updated = 0;
    const skipped: { number: number; reason: string }[] = numbers
      .filter((number) => !orders.some((order) => order.number === number))
      .map((number) => ({ number, reason: "Order not found." }));
    for (const order of orders) {
      try {
        const before = deriveStatus(order);
        await changeOrderStatus(order, status, adminName);
        if (before !== status) updated += 1;
      } catch (error) {
        if (!(error instanceof HttpError)) throw error;
        skipped.push({ number: order.number, reason: error.message });
      }
    }
    // cancelling or refunding gives stock back, which the shop shows
    if (updated > 0 && (status === "cancelled" || status === "refunded")) notifier.revalidate(["catalog"]);
    res.json({ updated, skipped });
  });

  router.get("/:number", async (req, res) => {
    const order = await findByNumber(req.params.number);
    res.json({ order: adminOrder(order.toObject() as unknown as OrderDoc) });
  });

  router.patch("/:number", async (req, res) => {
    const data = parse(updateSchema, req.body);
    const order = await findByNumber(req.params.number);
    const adminName = res.locals.admin.name as string;

    if (data.tracking) {
      order.set("tracking.carrier", data.tracking.carrier);
      order.set("tracking.trackingNumber", data.tracking.trackingNumber);
      addNote(order, `Tracking added: ${data.tracking.carrier ? `${data.tracking.carrier} · ` : ""}${data.tracking.trackingNumber}.`, adminName);
    }
    // changeOrderStatus saves the order (tracking above rides along); with no status change, save here.
    if (data.status) await changeOrderStatus(order, data.status, adminName);
    if (order.isModified()) await order.save();
    if (data.status === "cancelled" || data.status === "refunded") notifier.revalidate(["catalog"]);

    res.json({ order: adminOrder(order.toObject() as unknown as OrderDoc) });
  });

  router.post("/:number/notes", async (req, res) => {
    const { text, customerNote } = parse(noteSchema, req.body);
    const order = await findByNumber(req.params.number);
    addNote(order, text, res.locals.admin.name as string, customerNote);
    await order.save();
    res.status(201).json({ order: adminOrder(order.toObject() as unknown as OrderDoc) });
  });

  router.delete("/:number/notes/:noteId", async (req, res) => {
    const order = await findByNumber(req.params.number);
    const note = mongoose.isValidObjectId(req.params.noteId) ? order.notes.id(req.params.noteId) : null;
    if (!note) throw HttpError.notFound("Note not found.", "NOTE_NOT_FOUND");
    note.deleteOne();
    await order.save();
    res.json({ order: adminOrder(order.toObject() as unknown as OrderDoc) });
  });

  return router;
}
