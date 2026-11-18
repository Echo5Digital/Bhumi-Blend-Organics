import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Order } from "../src/models/Order.js";
import { fakeGateway, startTestApp, validAddress } from "./helpers.js";

// What happens when payments can't work: keys not set yet, or Razorpay down.

const order = { items: [{ slug: "aloe-pure-shampoo", qty: 1 }], email: "a@b.co", shipping: validAddress };

describe("Razorpay keys not set", () => {
  let ctx: Awaited<ReturnType<typeof startTestApp>>;
  beforeAll(async () => {
    ctx = await startTestApp({ payments: fakeGateway({ configured: false }).gateway });
  });
  afterAll(() => ctx.stop());

  it("answers 503 and creates no order", async () => {
    const response = await ctx.api.post("/api/orders").send(order);
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("PAYMENTS_NOT_CONFIGURED");
    expect(await Order.countDocuments()).toBe(0);
  });

  it("says so on the health check", async () => {
    const { body } = await ctx.api.get("/api/health");
    expect(body.payments).toBe(false);
  });
});
