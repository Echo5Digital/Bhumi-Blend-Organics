import { Schema, model } from "mongoose";

// Named running numbers; today only the order number (10001, 10002, ...).
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter = model("Counter", counterSchema);

/** The next number for `name`, counting up from `start + 1`. Atomic, so two orders never share a number. */
export async function nextSequence(name: string, start = 0): Promise<number> {
  try {
    // Create the counter at `start` the very first time; later calls change nothing.
    await Counter.updateOne({ _id: name }, { $setOnInsert: { seq: start } }, { upsert: true });
  } catch (error) {
    // Two first-ever orders at once: the other one created it a moment ago. Fine.
    if ((error as { code?: number }).code !== 11000) throw error;
  }
  const counter = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { returnDocument: "after" });
  if (!counter) throw new Error(`Could not read counter "${name}"`);
  return counter.seq;
}
