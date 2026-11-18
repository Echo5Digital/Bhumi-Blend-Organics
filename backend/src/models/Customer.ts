import { Schema, model, type InferSchemaType } from "mongoose";
import { addressSchema } from "./schemas.js";

// A shopper with an account (registering is optional — guests can still check out).
const customerSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    /** The address book: one default shipping and one billing address. */
    addresses: {
      shipping: { type: addressSchema },
      billing: { type: addressSchema },
    },
    isActive: { type: Boolean, default: true },
    /** When they proved they own the email (by entering the code we mailed). */
    emailVerifiedAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type CustomerRecord = InferSchemaType<typeof customerSchema>;
export const Customer = model("Customer", customerSchema);
