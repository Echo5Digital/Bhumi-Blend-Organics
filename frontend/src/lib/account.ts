import { api } from "@/lib/api";
import type { Customer } from "@/lib/auth";
import type { Address, StoredAddress } from "@/lib/checkout";

// The calls a logged-in visitor's account pages make. Each takes the session
// token (lib/auth.ts) and rejects with an ApiError (lib/api.ts) on failure.

export type AccountOrder = {
  number: number;
  createdAt: string;
  email: string;
  items: {
    slug: string;
    name: string;
    image?: string;
    size?: string;
    unitPrice: number;
    regularPrice?: number;
    qty: number;
    lineTotal: number;
  }[];
  shipping: StoredAddress;
  billing: StoredAddress;
  coupon?: { code: string; discount: number };
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  paymentStatus: "pending" | "paid" | "refunded";
  fulfilmentStatus: "new" | "processing" | "shipped" | "delivered" | "cancelled";
  tracking?: { carrier?: string; trackingNumber: string; shippedAt?: string };
};

export const fetchCustomer = (token: string) => api<{ customer: Customer }>("/account/me", { token }).then((r) => r.customer);

export const fetchOrders = (token: string) =>
  api<{ items: AccountOrder[]; total: number }>("/account/orders?limit=50", { token });

export const saveAddress = (token: string, kind: "shipping" | "billing", address: Address) =>
  api<{ customer: Customer }>(`/account/addresses/${kind}`, { method: "PUT", body: address, token }).then((r) => r.customer);

export const saveDetails = (
  token: string,
  details: { firstName?: string; lastName?: string; email?: string; currentPassword?: string; newPassword?: string },
) => api<{ customer: Customer }>("/account/me", { method: "PATCH", body: details, token }).then((r) => r.customer);

/** What the shopper sees for an order: awaiting payment, processing, shipped, delivered, cancelled or refunded. */
export function orderStatusLabel(order: Pick<AccountOrder, "paymentStatus" | "fulfilmentStatus">): string {
  if (order.paymentStatus === "refunded") return "Refunded";
  if (order.paymentStatus === "pending") return order.fulfilmentStatus === "cancelled" ? "Cancelled" : "Awaiting payment";
  switch (order.fulfilmentStatus) {
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return "Processing";
  }
}
