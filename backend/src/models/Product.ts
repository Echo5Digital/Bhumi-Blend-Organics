import { Schema, model, type InferSchemaType } from "mongoose";

// A product, shaped from the storefront's catalogue (frontend/src/data). The
// card fields (name, prices, photos, stars) are real columns so they can be
// queried and sorted; the long page content (description, ingredients, FAQs,
// gallery...) is one `details` blob that the product page renders as-is.
//
// Photos are `{ url, publicId }`. Until the images are moved to Cloudinary
// (`npm run images:upload`) the url is the storefront's own path, e.g.
// "/Hair-Oil-Organic.jpg", which still works on the storefront.

const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    /** Cloudinary id, used to delete the file. Empty for photos still on the storefront. */
    publicId: { type: String, trim: true },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    /** Current price in INR. */
    price: { type: Number, required: true, min: 0 },
    /** Original price — only set when the product is on offer. */
    regularPrice: { type: Number, min: 0 },
    image: { type: imageSchema, required: true },
    hoverImage: { type: imageSchema },
    /** Stars shown on the product card (only where the live site shows them). */
    rating: { type: Number, min: 0, max: 5 },
    /** Pack size shown under the name: "100g", "450ml". */
    weight: { type: String, trim: true },
    /** Category pages this product is on, with its place in each page's order. */
    categories: {
      type: [new Schema({ category: { type: String, required: true }, position: { type: Number, default: 0 } }, { _id: false })],
      default: [],
    },
    /** Home-page rows (e.g. "best-sellers", "skin-care-essentials") with the order inside each. */
    collections: {
      type: [new Schema({ key: { type: String, required: true }, position: { type: Number, default: 0 } }, { _id: false })],
      default: [],
    },
    /** Place in the main shop list. */
    position: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    /**
     * How many are left. Leave it empty to not count stock (then `inStock` is a simple on/off switch).
     * When set, a paid order takes from it and `inStock` follows it (0 = out of stock).
     */
    stockQuantity: { type: Number, min: 0 },
    /** Hidden products are not sold and have no page, but keep their order history. */
    isActive: { type: Boolean, default: true },
    /** The product page content (see frontend/src/data/productDetails.ts). */
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

productSchema.index({ isActive: 1, position: 1 });
productSchema.index({ "categories.category": 1 });
productSchema.index({ "collections.key": 1 });

export type ProductRecord = InferSchemaType<typeof productSchema>;
export const Product = model("Product", productSchema);
