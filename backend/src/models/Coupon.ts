import { Schema, model, type InferSchemaType } from "mongoose";

const couponSchema = new Schema(
  {
    /** Always stored in capitals; shoppers can type it in any case. */
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ["percent", "fixed"], required: true },
    /** Percent (1–100) or rupees off, depending on `type`. */
    value: { type: Number, required: true, min: 0 },
    /** Cap for percent coupons, in rupees. */
    maxDiscount: { type: Number, min: 0 },
    /** The cart must come to at least this many rupees. */
    minSubtotal: { type: Number, min: 0, default: 0 },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    /** Total number of orders that may use it (empty = unlimited). */
    usageLimit: { type: Number, min: 1 },
    /** Orders that have paid with it. */
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CouponRecord = InferSchemaType<typeof couponSchema>;
export const Coupon = model("Coupon", couponSchema);
