import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Product } from "../src/models/Product.js";
import { Review } from "../src/models/Review.js";
import { combineRating } from "../src/services/reviews.js";
import { adminHeader, fakeNotifier, startTestApp } from "./helpers.js";

const storefront = fakeNotifier();
let ctx: Awaited<ReturnType<typeof startTestApp>>;
let auth: { Authorization: string };
let slug: string;
let otherSlug: string;

beforeAll(async () => {
  ctx = await startTestApp({ notifier: storefront.notifier });
  auth = await adminHeader(ctx.api);
  const [first, second] = await Product.find({ isActive: true }).limit(2).lean();
  slug = first!.slug;
  otherSlug = second!.slug;
});
afterAll(() => ctx.stop());
beforeEach(async () => {
  await Review.deleteMany({});
  await Product.updateOne({ slug }, { $unset: { "details.rating": "" } });
  storefront.calls.length = 0;
});

const valid = { rating: 4, review: "  Lovely texture, my skin feels soft.  ", name: "  Asha  ", email: "Asha@Example.COM" };
const send = (body: object, forSlug = slug) => ctx.api.post(`/api/products/${forSlug}/reviews`).send(body);
const readPublic = (query = "", forSlug = slug) => ctx.api.get(`/api/products/${forSlug}/reviews${query}`);
const adminList = (query = "") => ctx.api.get(`/api/admin/reviews${query}`).set(auth);
const setStatus = (id: string, status: string) => ctx.api.patch(`/api/admin/reviews/${id}`).set(auth).send({ status });

describe("sending a review", () => {
  it("saves it as pending, tidied up, and says it awaits approval", async () => {
    const res = await send(valid).expect(201);
    expect(res.body).toMatchObject({ status: "pending", message: "Your review is awaiting approval." });
    expect(res.body.id).toMatch(/^[a-f0-9]{24}$/);

    const saved = await Review.find().lean();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      productSlug: slug,
      rating: 4,
      review: "Lovely texture, my skin feels soft.",
      name: "Asha",
      email: "asha@example.com",
      status: "pending",
    });
  });

  it("does not need stars (0 or missing means no rating)", async () => {
    await send({ ...valid, rating: 0 }).expect(201);
    const { rating: _unused, ...withoutRating } = valid;
    await send(withoutRating).expect(201);
    const saved = await Review.find().lean();
    expect(saved).toHaveLength(2);
    expect(saved.every((item) => item.rating == null)).toBe(true);
  });

  it("refuses a missing review, name or email, and says which", async () => {
    const res = await send({ rating: 3, review: " ", name: "", email: "" }).expect(400);
    const fields = (res.body.error.details as { path: string }[]).map((detail) => detail.path).sort();
    expect(fields).toEqual(["email", "name", "review"]);
    expect(await Review.countDocuments()).toBe(0);
  });

  it("refuses a bad email, too many stars, or a far too long review", async () => {
    await send({ ...valid, email: "nope" }).expect(400);
    await send({ ...valid, rating: 6 }).expect(400);
    await send({ ...valid, rating: 2.5 }).expect(400);
    await send({ ...valid, review: "x".repeat(3001) }).expect(400);
    expect(await Review.countDocuments()).toBe(0);
  });

  it("only works for a product that is on sale", async () => {
    await send(valid, "no-such-product").expect(404);
    await Product.updateOne({ slug: otherSlug }, { isActive: false });
    await send(valid, otherSlug).expect(404);
    await readPublic("", otherSlug).expect(404);
    await Product.updateOne({ slug: otherSlug }, { isActive: true });
    expect(await Review.countDocuments()).toBe(0);
  });

  it("quietly keeps nothing when the hidden robot-trap box is filled in", async () => {
    const res = await send({ ...valid, company: "Spam Co" }).expect(201);
    expect(res.body.id).toBe("");
    expect(await Review.countDocuments()).toBe(0);
  });
});

describe("what visitors see", () => {
  it("never shows a pending or rejected review, nor anybody's email", async () => {
    const pending = (await send(valid).expect(201)).body.id as string;
    const rejected = (await send({ ...valid, review: "Rude words" }).expect(201)).body.id as string;
    await setStatus(rejected, "rejected").expect(200);

    const res = await readPublic().expect(200);
    expect(res.body.reviews).toEqual([]);
    // ...but the writer's own page can ask how their reviews are doing.
    const mine = await readPublic(`?own=${pending},${rejected},not-an-id`).expect(200);
    expect(mine.body.reviews).toEqual([]);
    expect(Object.fromEntries(mine.body.own.map((item: { id: string; status: string }) => [item.id, item.status]))).toEqual({ [pending]: "pending", [rejected]: "rejected" });
    expect(JSON.stringify(res.body)).not.toContain("example.com");
  });

  it("shows a review once approved (newest first, with name, stars and text), only on its own product", async () => {
    const first = (await send(valid).expect(201)).body.id as string;
    const second = (await send({ review: "Second one", name: "Ravi", email: "ravi@example.com" }).expect(201)).body.id as string;
    await setStatus(first, "approved").expect(200);
    await setStatus(second, "approved").expect(200);

    const res = await readPublic().expect(200);
    expect(res.body.reviews.map((item: { name: string }) => item.name)).toEqual(["Ravi", "Asha"]);
    expect(res.body.reviews[1]).toMatchObject({ id: first, name: "Asha", rating: 4, review: "Lovely texture, my skin feels soft." });
    expect(res.body.reviews[0].rating).toBeUndefined();
    expect(res.body.reviews[0].email).toBeUndefined();
    expect((await readPublic("", otherSlug).expect(200)).body.reviews).toEqual([]);

    // Taking it down again hides it again.
    await setStatus(first, "pending").expect(200);
    expect((await readPublic().expect(200)).body.reviews).toHaveLength(1);
  });

  it("adds approved reviews to the product page's star rating, on top of the old rating", async () => {
    await Product.updateOne({ slug }, { $set: { "details.rating": { value: 4, count: 2 } } });
    const before = (await ctx.api.get(`/api/products/${slug}`).expect(200)).body.details.rating;
    expect(before).toEqual({ value: 4, count: 2 });

    const stars = (await send({ ...valid, rating: 5 }).expect(201)).body.id as string;
    const noStars = (await send({ review: "No stars from me", name: "Mala", email: "mala@example.com" }).expect(201)).body.id as string;
    // Pending reviews change nothing...
    expect((await ctx.api.get(`/api/products/${slug}`).expect(200)).body.details.rating).toEqual({ value: 4, count: 2 });
    // ...approved ones are counted: 2 old ratings of 4 stars + one new 5 = 4.33; 4 reviews in all.
    await setStatus(stars, "approved").expect(200);
    await setStatus(noStars, "approved").expect(200);
    expect((await ctx.api.get(`/api/products/${slug}`).expect(200)).body.details.rating).toEqual({ value: 4.33, count: 4 });
  });

  it("leaves the product page exactly as it was when nothing is approved", async () => {
    const detail = (await ctx.api.get(`/api/products/${slug}`).expect(200)).body;
    await send(valid).expect(201);
    expect((await ctx.api.get(`/api/products/${slug}`).expect(200)).body).toEqual(detail);
  });
});

describe("the admin's Reviews screen", () => {
  it("needs an admin login", async () => {
    await ctx.api.get("/api/admin/reviews").expect(401);
    await ctx.api.patch("/api/admin/reviews/aaaaaaaaaaaaaaaaaaaaaaaa").send({ status: "approved" }).expect(401);
    await ctx.api.delete("/api/admin/reviews/aaaaaaaaaaaaaaaaaaaaaaaa").expect(401);
    await ctx.api.post("/api/admin/reviews/bulk").send({ ids: ["aaaaaaaaaaaaaaaaaaaaaaaa"], action: "delete" }).expect(401);
  });

  it("lists every review with its product, the email, and a count per status", async () => {
    const a = (await send(valid).expect(201)).body.id as string;
    await send({ review: "Another", name: "Ravi", email: "ravi@example.com" }, otherSlug).expect(201);
    await setStatus(a, "approved").expect(200);

    const all = (await adminList().expect(200)).body;
    expect(all.counts).toEqual({ all: 2, pending: 1, approved: 1, rejected: 0 });
    expect(all.total).toBe(2);
    const row = all.items.find((item: { id: string }) => item.id === a);
    expect(row).toMatchObject({ productSlug: slug, rating: 4, name: "Asha", email: "asha@example.com", status: "approved" });
    expect(typeof row.productName).toBe("string");
    expect(row.productName).not.toBe("");

    const pendingOnly = (await adminList("?status=pending").expect(200)).body;
    expect(pendingOnly.items).toHaveLength(1);
    expect(pendingOnly.items[0].name).toBe("Ravi");
    expect(pendingOnly.counts.all).toBe(2); // the tab counts don't shrink with the filter

    expect((await adminList("?search=ravi%40example").expect(200)).body.items).toHaveLength(1);
    expect((await adminList("?search=nothing-like-this").expect(200)).body.items).toHaveLength(0);
    await adminList("?status=bogus").expect(400);
  });

  it("approves, rejects and deletes one review, telling the storefront to refresh each time", async () => {
    const id = (await send(valid).expect(201)).body.id as string;

    const approved = await setStatus(id, "approved").expect(200);
    expect(approved.body.review).toMatchObject({ id, status: "approved" });
    await setStatus(id, "rejected").expect(200);
    expect((await Review.findById(id).lean())?.status).toBe("rejected");
    await setStatus(id, "bogus").expect(400);
    expect(storefront.calls).toEqual([["catalog"], ["catalog"]]);

    await ctx.api.delete(`/api/admin/reviews/${id}`).set(auth).expect(204);
    expect(await Review.countDocuments()).toBe(0);
    expect(storefront.calls).toHaveLength(3);
    await ctx.api.delete(`/api/admin/reviews/${id}`).set(auth).expect(404);
    await setStatus(id, "approved").expect(404);
    await setStatus("not-an-id", "approved").expect(404);
  });

  it("works on several reviews at once", async () => {
    const ids = [] as string[];
    for (const name of ["A", "B", "C"]) ids.push((await send({ ...valid, name }).expect(201)).body.id as string);

    const approve = await ctx.api.post("/api/admin/reviews/bulk").set(auth).send({ ids: ids.slice(0, 2), action: "approve" }).expect(200);
    expect(approve.body).toEqual({ updated: 2 });
    expect((await readPublic().expect(200)).body.reviews).toHaveLength(2);

    await ctx.api.post("/api/admin/reviews/bulk").set(auth).send({ ids: [ids[0]], action: "reject" }).expect(200);
    expect((await readPublic().expect(200)).body.reviews).toHaveLength(1);

    const removed = await ctx.api.post("/api/admin/reviews/bulk").set(auth).send({ ids, action: "delete" }).expect(200);
    expect(removed.body).toEqual({ updated: 3 });
    expect(await Review.countDocuments()).toBe(0);

    await ctx.api.post("/api/admin/reviews/bulk").set(auth).send({ ids: [], action: "delete" }).expect(400);
    await ctx.api.post("/api/admin/reviews/bulk").set(auth).send({ ids: ["nope"], action: "delete" }).expect(400);
    await ctx.api.post("/api/admin/reviews/bulk").set(auth).send({ ids, action: "explode" }).expect(400);
  });
});

describe("combining ratings", () => {
  it("counts the old rating and the approved reviews together", () => {
    expect(combineRating({ value: 4, count: 2 }, { count: 2, rated: 1, sum: 5 })).toEqual({ value: 4.33, count: 4 });
    expect(combineRating(undefined, { count: 3, rated: 2, sum: 9 })).toEqual({ value: 4.5, count: 3 });
    expect(combineRating({ value: 0, count: 0 }, { count: 1, rated: 0, sum: 0 })).toEqual({ value: 0, count: 1 });
    expect(combineRating({ value: 5, count: 1 }, { count: 1, rated: 1, sum: 3 })).toEqual({ value: 4, count: 2 });
  });
});
