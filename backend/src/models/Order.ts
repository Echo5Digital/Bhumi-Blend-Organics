import { Schema, model, type InferSchemaType } from "mongoose";
import { addressSchema } from "./schemas.js";

// An order. Everything the shopper was shown is copied into it (names, prices,
// totals) so later price changes or a deleted product never rewrite history.

const itemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String },
    size: { type: String },
    unitPrice: { type: Number, required: true, min: 0 },
    regularPrice: { type: Number, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

export const PAYMENT_STATUSES = ["pending", "paid", "refunded"] as const;
export const FULFILMENT_STATUSES = ["new", "processing", "shipped", "delivered", "cancelled"] as const;

const orderSchema = new Schema(
  {
    /** The number the shopper sees: 10001, 10002, ... */
    number: { type: Number, required: true, unique: true },
    /** SHA-256 of the secret that lets the shopper look at / pay for / cancel this order. */
    accessTokenHash: { type: String, required: true, select: false },
    /** The customer who placed it. Every new order has one (checkout needs a login); only orders imported from the old shop can be without. */
    customer: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    items: { type: [itemSchema], required: true },
    shipping: { type: addressSchema, required: true },
    billing: { type: addressSchema, required: true },
    billingSameAsShipping: { type: Boolean, default: true },
    note: { type: String, trim: true },

    coupon: {
      code: { type: String },
      discount: { type: Number, min: 0 },
    },
    currency: { type: String, default: "INR" },
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    shippingTotal: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "pending" },
    fulfilmentStatus: { type: String, enum: FULFILMENT_STATUSES, default: "new" },
    payment: {
      provider: { type: String, default: "razorpay" },
      razorpayOrderId: { type: String, index: true, sparse: true },
      razorpayPaymentId: { type: String },
      paidAt: { type: Date },
      /** Last failure reported by Razorpay (the shopper can still retry). */
      lastError: { type: String },
    },
    tracking: {
      carrier: { type: String, trim: true },
      trackingNumber: { type: String, trim: true },
      shippedAt: { type: Date },
    },
    /** True once this order's items have been taken off the products' stock (so cancelling can give them back). */
    stockReduced: { type: Boolean, default: false },
    /** When the "New order" email went out (set before sending, so it can only ever be sent once). */
    newOrderEmailSentAt: { type: Date },
    /** The same for the "Order received" email to the customer. */
    customerEmailSentAt: { type: Date },
    /** Notes on the order: private ones for the team, and ones the customer is meant to see. */
    notes: {
      type: [
        new Schema(
          {
            text: { type: String, required: true, trim: true, maxlength: 2000 },
            /** The admin who wrote it, or "System" for automatic entries. */
            author: { type: String, default: "System" },
            customerNote: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: true },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ email: 1 });
orderSchema.index({ paymentStatus: 1, fulfilmentStatus: 1 });

export type OrderRecord = InferSchemaType<typeof orderSchema>;
export const Order = model("Order", orderSchema);
