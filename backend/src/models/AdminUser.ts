import { Schema, model, type InferSchemaType } from "mongoose";

// Someone who can log in to the admin panel. Customers have no accounts —
// the store checks out as a guest, like the old WooCommerce site did.
const adminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin"], default: "admin" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type AdminUserRecord = InferSchemaType<typeof adminUserSchema>;
export const AdminUser = model("AdminUser", adminUserSchema);
