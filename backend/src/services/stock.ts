import type { Types } from "mongoose";
import { Product } from "../models/Product.js";

// Stock counting. Only products that have a `stockQuantity` are counted; the
// rest are a plain in/out switch. The arithmetic runs inside MongoDB in one
// step, so two orders paid at the same moment can't overwrite each other's change.

type Line = { product: Types.ObjectId | unknown; qty: number };

/** Take an order's items off the shelf (never below zero); a product that hits zero becomes "out of stock". */
export async function reduceStock(items: Line[]) {
  for (const item of items) {
    await Product.collection.updateOne({ _id: item.product as Types.ObjectId, stockQuantity: { $type: "number" } }, [
      { $set: { stockQuantity: { $max: [0, { $subtract: ["$stockQuantity", item.qty] }] } } },
      { $set: { inStock: { $gt: ["$stockQuantity", 0] } } },
    ]);
  }
}

/** Put them back (an order was cancelled or refunded after its stock was taken). */
export async function restoreStock(items: Line[]) {
  for (const item of items) {
    await Product.collection.updateOne({ _id: item.product as Types.ObjectId, stockQuantity: { $type: "number" } }, [
      { $set: { stockQuantity: { $add: ["$stockQuantity", item.qty] } } },
      { $set: { inStock: { $gt: ["$stockQuantity", 0] } } },
    ]);
  }
}
