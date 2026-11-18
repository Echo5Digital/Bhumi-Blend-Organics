import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Order } from "../src/models/Order.js";
import { fakeGateway, startTestApp, validAddress } from "./helpers.js";

describe("Razorpay refuses to create the payment", () => {
  let ctx: Awaited<ReturnType<typeof startTestApp>>;
  beforeAll(async () => {
    ctx = await startTestApp({ payments: fakeGateway({ failCreate: true }).gateway });
  });
  afterAll(() => ctx.stop());

  it("answers with a safe 500, and doesn't leave the order looking open", async () => {
    const response = await ctx.api
      .post("/api/orders")
      .send({ items: [{ slug: "aloe-pure-shampoo", qty: 1 }], email: "a@b.co", shipping: validAddress });
    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain("gateway down");
    const stored = await Order.findOne();
    expect(stored?.fulfilmentStatus).toBe("cancelled");
    expect(stored?.paymentStatus).toBe("pending");
  });
});
