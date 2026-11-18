import type { Types } from "mongoose";
import type { CustomerRecord } from "../models/Customer.js";
import { deriveStatus } from "./orderStatus.js";
import type { OrderRecord } from "../models/Order.js";
import type { ProductRecord } from "../models/Product.js";

// What the API sends out. The product "card" is the same shape as the
// storefront's `Product` type (slug, name, image, hoverImage, price,
// regularPrice, rating) plus `inStock`, so the shop can use it unchanged.

export type ProductDoc = ProductRecord & { _id: Types.ObjectId };
export type OrderDoc = OrderRecord & { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date };

export function productCard(product: ProductDoc) {
  return {
    slug: product.slug,
    name: product.name,
    image: product.image.url,
    hoverImage: product.hoverImage?.url ?? product.image.url,
    price: product.price,
    ...(product.regularPrice != null && { regularPrice: product.regularPrice }),
    ...(product.rating != null && { rating: product.rating }),
    ...(product.weight && { weight: product.weight }),
    inStock: product.inStock !== false,
  };
}

export type ProductCard = ReturnType<typeof productCard>;

/** Everything the product page needs; `related` / `bundle` are the cards for the slugs the content lists. */
export function productDetail(product: ProductDoc, related: ProductCard[], bundle: { product: ProductCard; quantity: number }[]) {
  return {
    ...productCard(product),
    sku: product.sku ?? undefined,
    weight: product.weight ?? undefined,
    categories: product.categories.map((entry) => entry.category),
    details: product.details ?? null,
    related,
    bundle,
  };
}

/** The admin's full view of a product (every field, including hidden ones). */
export function adminProduct(product: ProductDoc & { createdAt?: Date; updatedAt?: Date }) {
  return {
    id: String(product._id),
    slug: product.slug,
    name: product.name,
    sku: product.sku ?? undefined,
    price: product.price,
    regularPrice: product.regularPrice ?? undefined,
    image: product.image,
    hoverImage: product.hoverImage ?? undefined,
    rating: product.rating ?? undefined,
    weight: product.weight ?? undefined,
    categories: product.categories,
    collections: product.collections,
    position: product.position,
    inStock: product.inStock,
    stockQuantity: product.stockQuantity ?? undefined,
    isActive: product.isActive,
    details: product.details ?? null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export type CustomerDoc = CustomerRecord & { _id: Types.ObjectId };

/** A shopper's own account details. Never includes the password hash. */
export function publicCustomer(customer: CustomerDoc) {
  return {
    id: String(customer._id),
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    displayName: `${customer.firstName} ${customer.lastName}`.trim(),
    addresses: {
      shipping: customer.addresses?.shipping ?? undefined,
      billing: customer.addresses?.billing ?? undefined,
    },
  };
}

/** An order as the shopper (holding the order's token) or the admin sees it. */
export function publicOrder(order: OrderDoc) {
  return {
    number: order.number,
    createdAt: order.createdAt,
    email: order.email,
    items: order.items.map((item) => ({
      slug: item.slug,
      name: item.name,
      image: item.image ?? undefined,
      size: item.size ?? undefined,
      unitPrice: item.unitPrice,
      regularPrice: item.regularPrice ?? undefined,
      qty: item.qty,
      lineTotal: item.lineTotal,
    })),
    shipping: order.shipping,
    billing: order.billing,
    billingSameAsShipping: order.billingSameAsShipping,
    note: order.note ?? undefined,
    coupon: order.coupon?.code ? { code: order.coupon.code, discount: order.coupon.discount ?? 0 } : undefined,
    currency: order.currency,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    shippingTotal: order.shippingTotal,
    total: order.total,
    paymentStatus: order.paymentStatus,
    fulfilmentStatus: order.fulfilmentStatus,
    status: deriveStatus(order),
    // only the notes the team wrote for the customer to see
    customerNotes: (order.notes ?? []).filter((note) => note.customerNote).map((note) => ({ text: note.text, createdAt: note.createdAt })),
    paymentMethod: "Credit Card/Debit Card/UPI/NetBanking",
    paidAt: order.payment?.paidAt ?? undefined,
    tracking: order.tracking?.trackingNumber
      ? {
          carrier: order.tracking.carrier ?? undefined,
          trackingNumber: order.tracking.trackingNumber,
          shippedAt: order.tracking.shippedAt ?? undefined,
        }
      : undefined,
  };
}

/** Admin-only extras on top of `publicOrder`. */
export function adminOrder(order: OrderDoc) {
  return {
    ...publicOrder(order),
    id: String(order._id),
    updatedAt: order.updatedAt,
    customerId: order.customer ? String(order.customer) : undefined,
    stockReduced: order.stockReduced ?? false,
    notes: (order.notes ?? []).map((note) => ({
      id: String(note._id),
      text: note.text,
      author: note.author ?? "System",
      customerNote: note.customerNote ?? false,
      createdAt: note.createdAt,
    })),
    payment: {
      provider: order.payment?.provider ?? "razorpay",
      razorpayOrderId: order.payment?.razorpayOrderId ?? undefined,
      razorpayPaymentId: order.payment?.razorpayPaymentId ?? undefined,
      lastError: order.payment?.lastError ?? undefined,
    },
  };
}
