import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Order } from "../src/models/Order.js";
import { customerHeader, fakeGateway, startTestApp, validAddress } from "./helpers.js";

// What happens when payments can't work: keys not set yet (orders are still placed, unpaid), or Razorpay down.

const order = { items: [{ slug: "aloe-pure-shampoo", qty: 1 }], email: "a@b.co", shipping: validAddress };

describe("Razorpay keys not set", () => {
  let ctx: Awaited<ReturnType<typeof startTestApp>>;
  beforeAll(async () => {
    ctx = await startTestApp({ payments: fakeGateway({ configured: false }).gateway });
  });
  afterAll(() => ctx.stop());

  it("still places the order, as pending payment with nothing to pay yet", async () => {
    const response = await ctx.api.post("/api/orders").set(await customerHeader(ctx)).send(order).expect(201);
    expect(response.body.payment).toBeNull();
    expect(typeof response.body.accessToken).toBe("string");
    expect(response.body.order).toMatchObject({ paymentStatus: "pending", fulfilmentStatus: "new", status: "pending" });

    const saved = await Order.findOne({ number: response.body.order.number });
    expect(saved?.payment?.razorpayOrderId).toBeUndefined();
    expect(saved?.stockReduced).toBe(false);
    // the team can see why it is waiting
    expect(saved?.notes.map((note) => note.text).join(" ")).toContain("Razorpay isn't connected");
  });

  it("gives a payment popup nothing to open, but the shopper can still cancel the order", async () => {
    const placed = (await ctx.api.post("/api/orders").set(await customerHeader(ctx)).send(order).expect(201)).body;
    const header = { "X-Order-Token": placed.accessToken as string };

    const pay = await ctx.api.post(`/api/orders/${placed.order.number}/payment`).set(header);
    expect(pay.status).toBe(409);
    expect(pay.body.error.code).toBe("ORDER_NOT_PAYABLE");

    const cancelled = await ctx.api.post(`/api/orders/${placed.order.number}/cancel`).set(header).expect(200);
    expect(cancelled.body.order.status).toBe("cancelled");
  });

  it("says so on the health check", async () => {
    const { body } = await ctx.api.get("/api/health");
    expect(body.payments).toBe(false);
  });
});
