// WooCommerce shows one status per order ("Processing", "Completed"...). Here an
// order stores two things — whether it has been paid, and how far it has got —
// so the admin's single status is worked out from the pair:
//
//   pending     not paid yet (the shopper can still pay)
//   failed      not paid, and Razorpay reported a failed attempt
//   processing  paid, not sent yet
//   shipped     paid and handed to a courier
//   completed   paid and delivered
//   cancelled   cancelled (before payment, or by the admin afterwards)
//   refunded    paid, then refunded

export const ORDER_STATUSES = ["pending", "processing", "shipped", "completed", "cancelled", "refunded", "failed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

type StatusFields = {
  paymentStatus: string;
  fulfilmentStatus: string;
  payment?: { lastError?: string | null } | null;
};

export function deriveStatus(order: StatusFields): OrderStatus {
  if (order.paymentStatus === "refunded") return "refunded";
  if (order.fulfilmentStatus === "cancelled") return "cancelled";
  if (order.paymentStatus === "paid") {
    if (order.fulfilmentStatus === "shipped") return "shipped";
    if (order.fulfilmentStatus === "delivered") return "completed";
    return "processing";
  }
  return order.payment?.lastError ? "failed" : "pending";
}

/** The same rules as `deriveStatus`, as a MongoDB filter (for the status tabs and their counts). */
export const STATUS_FILTERS: Record<OrderStatus, Record<string, unknown>> = {
  refunded: { paymentStatus: "refunded" },
  cancelled: { paymentStatus: { $ne: "refunded" }, fulfilmentStatus: "cancelled" },
  processing: { paymentStatus: "paid", fulfilmentStatus: { $in: ["new", "processing"] } },
  shipped: { paymentStatus: "paid", fulfilmentStatus: "shipped" },
  completed: { paymentStatus: "paid", fulfilmentStatus: "delivered" },
  pending: { paymentStatus: "pending", fulfilmentStatus: { $ne: "cancelled" }, "payment.lastError": { $in: [null, ""] } },
  failed: { paymentStatus: "pending", fulfilmentStatus: { $ne: "cancelled" }, "payment.lastError": { $nin: [null, ""] } },
};

/** What the admin may set an order to. (pending / failed only ever come from the shopper's side.) */
export const ADMIN_TARGET_STATUSES = ["processing", "shipped", "completed", "cancelled", "refunded"] as const;
export type AdminTargetStatus = (typeof ADMIN_TARGET_STATUSES)[number];

export function fieldsForStatus(target: AdminTargetStatus): { paymentStatus?: "refunded"; fulfilmentStatus?: string } {
  switch (target) {
    case "processing":
      return { fulfilmentStatus: "processing" };
    case "shipped":
      return { fulfilmentStatus: "shipped" };
    case "completed":
      return { fulfilmentStatus: "delivered" };
    case "cancelled":
      return { fulfilmentStatus: "cancelled" };
    case "refunded":
      return { paymentStatus: "refunded" };
  }
}

/** null when the change is allowed, otherwise the reason it isn't. */
export function transitionProblem(current: OrderStatus, target: AdminTargetStatus): string | null {
  if (current === target) return null;
  if (current === "cancelled" || current === "refunded") {
    return `A ${current} order can't be changed any more.`;
  }
  const paid = current === "processing" || current === "shipped" || current === "completed";
  if ((target === "processing" || target === "shipped" || target === "completed") && !paid) {
    return "This order hasn't been paid, so it can't be processed or shipped.";
  }
  if (target === "refunded" && !paid) return "Only a paid order can be marked as refunded.";
  return null;
}
