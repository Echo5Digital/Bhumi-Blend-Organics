import { Schema, model, type InferSchemaType } from "mongoose";

// A shop category (hair, face, body, combo). The storefront keeps each
// category page's banner and design itself; the backend needs the slug, the
// name, an on/off switch and an optional photo for the storefront's Category menu.
const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    /** Cloudinary id, empty for a photo that is only an address. */
    publicId: { type: String, trim: true },
  },
  { _id: false },
);

const categorySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    /** The photo on this category's card in the storefront's Category menu. */
    image: { type: imageSchema },
    position: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CategoryRecord = InferSchemaType<typeof categorySchema>;
export const Category = model("Category", categorySchema);
