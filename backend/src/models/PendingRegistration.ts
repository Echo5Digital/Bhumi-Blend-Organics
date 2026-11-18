import { Schema, model, type InferSchemaType } from "mongoose";

// A sign-up that is waiting for its emailed code. The account itself is only
// created once the code is entered, so nobody can register an address they
// can't read mail for (and an unverified sign-up can't squat on someone's email).
//
// Holds the password as a hash, never as typed. The code is stored as a keyed
// hash too. Rows delete themselves an hour after the last code was sent.
const pendingRegistrationSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },

    otpHash: { type: String, required: true, select: false },
    /** When the current code stops working (minutes after it was sent). */
    otpExpiresAt: { type: Date, required: true },
    /** Wrong guesses at the current code. */
    attempts: { type: Number, default: 0 },
    /** Codes sent for this sign-up so far (caps how many emails one address can get). */
    sendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },

    /** When MongoDB removes the whole row (kept longer than the code, so "resend" still works after it expires). */
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PendingRegistrationRecord = InferSchemaType<typeof pendingRegistrationSchema>;
export const PendingRegistration = model("PendingRegistration", pendingRegistrationSchema);
