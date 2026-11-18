import type { HydratedDocument } from "mongoose";
import { HttpError } from "../lib/httpError.js";
import { deriveStatus, fieldsForStatus, transitionProblem, type AdminTargetStatus } from "../lib/orderStatus.js";
import { Order, type OrderRecord } from "../models/Order.js";
import { restoreStock } from "./stock.js";

type OrderDocument = HydratedDocument<OrderRecord>;

const LABELS: Record<string, string> = {
  pending: "Pending payment",
  failed: "Failed",
  processing: "Processing",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/** Add a note to an order (in memory; the caller saves). */
export function addNote(order: OrderDocument, text: string, author: string, customerNote = false) {
  order.notes.push({ text, author, customerNote, createdAt: new Date() } as never);
}

/**
 * Move an order to a new status, the way the admin's dropdown / bulk actions do:
 * checks the change is allowed, gives the stock back if the order is being
 * cancelled or refunded, stamps the shipping time, and writes a note saying who
 * did it. Throws 409 when the change isn't allowed. Saves the order.
 */
export async function changeOrderStatus(order: OrderDocument, target: AdminTargetStatus, adminName: string) {
  const current = deriveStatus(order);
  if (current === target) return;

  const problem = transitionProblem(current, target);
  if (problem) throw HttpError.conflict(problem, "INVALID_STATUS_CHANGE");

  if (target === "cancelled" || target === "refunded") {
    // Flip the flag in the database first, so two clicks can't give the stock back twice.
    const flagged = await Order.findOneAndUpdate({ _id: order._id, stockReduced: true }, { $set: { stockReduced: false } });
    if (flagged) {
      await restoreStock(flagged.items);
      order.stockReduced = false;
    }
  }

  const fields = fieldsForStatus(target);
  if (fields.paymentStatus) order.paymentStatus = fields.paymentStatus;
  if (fields.fulfilmentStatus) order.fulfilmentStatus = fields.fulfilmentStatus as OrderRecord["fulfilmentStatus"];
  if (target === "shipped" && !order.tracking?.shippedAt) order.set("tracking.shippedAt", new Date());

  addNote(order, `Order status changed from ${LABELS[current]} to ${LABELS[target]}.`, adminName);
  await order.save();
}
