import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { signCustomerToken } from "../src/middleware/auth.js";
import { Customer } from "../src/models/Customer.js";
import { Order } from "../src/models/Order.js";
import { adminHeader, fakeGateway, paymentSignature, startTestApp, validAddress } from "./helpers.js";

const gateway = fakeGateway();
let ctx: Awaited<ReturnType<typeof startTestApp>>;
let auth: { Authorization: string };

beforeAll(async () => {
  ctx = await startTestApp({ payments: gateway.gateway });
  auth = await adminHeader(ctx.api);
});
afterAll(() => ctx.stop());
beforeEach(async () => {
  await Customer.deleteMany({});
  await Order.deleteMany({});
});

async function makeCustomer(email: string, firstName: string, lastName: string, extra: object = {}) {
  const customer = await Customer.create({ email, firstName, lastName, passwordHash: "not-used", ...extra });
  return { id: String(customer._id), token: signCustomerToken(ctx.env, String(customer._id)) };
}

/** Place an order (as a logged-in customer when a token is given) and optionally pay for it. */
async function order(options: { token?: string; email?: string; slug?: string; qty?: number; paid?: boolean; city?: string; name?: [string, string] }) {
  const request = ctx.api.post("/api/orders");
  if (options.token) request.set("Authorization", `Bearer ${options.token}`);
  const response = await request.send({
    items: [{ slug: options.slug ?? "aloe-pure-shampoo", qty: options.qty ?? 1 }],
    email: options.email ?? "guest@example.com",
    shipping: { ...validAddress, city: options.city ?? "Kochi", firstName: options.name?.[0] ?? "Asha", lastName: options.name?.[1] ?? "Nair" },
  });
  expect(response.status).toBe(201);
  if (options.paid !== false) {
    const rzp = response.body.payment.razorpayOrderId as string;
    await ctx.api
      .post(`/api/orders/${response.body.order.number}/verify-payment`)
      .set("X-Order-Token", response.body.accessToken)
      .send({ razorpay_order_id: rzp, razorpay_payment_id: `pay_${response.body.order.number}`, razorpay_signature: paymentSignature(rzp, `pay_${response.body.order.number}`) })
      .expect(200);
  }
  return response.body.order.number as number;
}

const list = async (query = "") => (await ctx.api.get(`/api/admin/customers${query}`).set(auth).expect(200)).body;

describe("customers list", () => {
  it("shows registered customers with what they've spent, and guests grouped by email", async () => {
    const asha = await makeCustomer("asha@example.com", "Asha", "Nair", { lastLoginAt: new Date("2026-05-01T10:00:00Z") });
    await makeCustomer("ben@example.com", "Ben", "Ray"); // never ordered
    await order({ token: asha.token, email: "asha@example.com", slug: "aloe-pure-shampoo", qty: 1, city: "Kochi" }); // 599
    await order({ token: asha.token, email: "asha@example.com", slug: "buy-pure-aloe-vera-gel", qty: 2 }); // 500
    await order({ token: asha.token, email: "asha@example.com", paid: false }); // unpaid: doesn't count
    await order({ email: "visitor@example.com", name: ["Vik", "Rao"], city: "Pune", qty: 1 }); // guest, 599
    await order({ email: "visitor@example.com", name: ["Vik", "Rao"], city: "Pune", qty: 1 }); // same guest again

    const { items, total } = await list("?sort=spend&dir=desc");
    expect(total).toBe(3);

    expect(items[0]).toMatchObject({ type: "guest", name: "Vik Rao", email: "visitor@example.com", orders: 2, totalSpend: 1198, averageOrderValue: 599, city: "Pune" });
    expect(items[0].id).toBeUndefined();
    expect(items[1]).toMatchObject({ type: "registered", name: "Asha Nair", email: "asha@example.com", orders: 2, totalSpend: 1099, averageOrderValue: 549.5, country: "India", city: "Kochi", state: "Kerala", postcode: "682001" });
    expect(items[1].id).toBe(asha.id);
    expect(items[2]).toMatchObject({ type: "registered", name: "Ben Ray", orders: 0, totalSpend: 0, averageOrderValue: 0 });
  });

  it("filters by kind and searches by name or email", async () => {
    await makeCustomer("asha@example.com", "Asha", "Nair");
    await order({ email: "visitor@example.com", name: ["Vik", "Rao"] });
    expect((await list("?type=registered")).items.map((c: { type: string }) => c.type)).toEqual(["registered"]);
    expect((await list("?type=guests")).items.map((c: { type: string }) => c.type)).toEqual(["guest"]);
    expect((await list("?search=ASHA")).total).toBe(1);
    expect((await list("?search=visitor@")).total).toBe(1);
    expect((await list("?search=nobody")).total).toBe(0);
  });

  it("uses the last login or last order for 'last active', and sorts by it", async () => {
    const older = await makeCustomer("older@example.com", "Old", "Er", { lastLoginAt: new Date("2026-01-01T00:00:00Z") });
    await makeCustomer("newer@example.com", "New", "Er", { lastLoginAt: new Date("2026-06-01T00:00:00Z") });
    await order({ token: older.token, email: "older@example.com" }); // ordering today makes "older" the most recently active
    const { items } = await list("?sort=lastActive&dir=desc");
    expect(items.map((c: { email: string }) => c.email)).toEqual(["older@example.com", "newer@example.com"]);
    expect((await list("?sort=lastActive&dir=asc")).items[0].email).toBe("newer@example.com");
  });

  it("sorts by name and pages", async () => {
    for (const [email, first] of [["c@example.com", "Chitra"], ["a@example.com", "Anil"], ["b@example.com", "Bina"]] as const) await makeCustomer(email, first, "X");
    expect((await list("?sort=name&dir=asc")).items.map((c: { name: string }) => c.name)).toEqual(["Anil X", "Bina X", "Chitra X"]);
    const page2 = await list("?sort=name&dir=asc&limit=2&page=2");
    expect(page2).toMatchObject({ total: 3, pages: 2, page: 2 });
    expect(page2.items.map((c: { name: string }) => c.name)).toEqual(["Chitra X"]);
  });

  it("needs a login", async () => {
    expect((await ctx.api.get("/api/admin/customers")).status).toBe(401);
  });
});

describe("one customer", () => {
  it("shows their details, totals and orders", async () => {
    const asha = await makeCustomer("asha@example.com", "Asha", "Nair", { emailVerifiedAt: new Date() });
    const first = await order({ token: asha.token, email: "asha@example.com", qty: 1 });
    await order({ token: asha.token, email: "asha@example.com", paid: false });

    const { customer, stats, orders } = (await ctx.api.get(`/api/admin/customers/${asha.id}`).set(auth).expect(200)).body;
    expect(customer).toMatchObject({ id: asha.id, email: "asha@example.com", displayName: "Asha Nair", isActive: true, emailVerified: true });
    expect(JSON.stringify(customer)).not.toContain("passwordHash");
    expect(stats).toEqual({ orders: 1, totalSpend: 599, averageOrderValue: 599 });
    expect(orders).toHaveLength(2);
    expect(orders.find((o: { number: number }) => o.number === first)).toMatchObject({ status: "processing", total: 599, itemCount: 1 });

    expect((await ctx.api.get("/api/admin/customers/not-an-id").set(auth)).status).toBe(404);
    expect((await ctx.api.get("/api/admin/customers/64b64b64b64b64b64b64b64b").set(auth)).status).toBe(404);
  });

  it("can be switched off, which stops them logging in", async () => {
    const asha = await makeCustomer("asha@example.com", "Asha", "Nair");
    const off = await ctx.api.patch(`/api/admin/customers/${asha.id}`).set(auth).send({ isActive: false }).expect(200);
    expect(off.body.customer).toEqual({ id: asha.id, isActive: false });
    expect((await ctx.api.get("/api/account/me").set("Authorization", `Bearer ${asha.token}`)).status).toBe(401);
    await ctx.api.patch(`/api/admin/customers/${asha.id}`).set(auth).send({ isActive: true }).expect(200);
    expect((await ctx.api.get("/api/account/me").set("Authorization", `Bearer ${asha.token}`)).status).toBe(200);
    expect((await ctx.api.patch(`/api/admin/customers/${asha.id}`).set(auth).send({ isActive: "no" })).status).toBe(400);
  });
});
