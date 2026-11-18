import { Schema, model, type InferSchemaType } from "mongoose";

// A shop category (hair, face, body, combo). The storefront keeps each
// category page's banner and design itself; the backend only needs the slug,
// the name and an on/off switch.
const categorySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    position: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CategoryRecord = InferSchemaType<typeof categorySchema>;
export const Category = model("Category", categorySchema);
