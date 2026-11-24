import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BlogComment } from "../src/models/BlogComment.js";
import { adminHeader, startTestApp } from "./helpers.js";

let ctx: Awaited<ReturnType<typeof startTestApp>>;
let auth: { Authorization: string };

beforeAll(async () => {
  ctx = await startTestApp({ seed: false });
  auth = await adminHeader(ctx.api);
});
afterAll(() => ctx.stop());
beforeEach(() => BlogComment.deleteMany({}));

const ARTICLE = "how-to-age-gracefully-restore-rejuvenate-and-glow-naturally";
const OTHER_ARTICLE = "spa-luxury-at-home-with-bhumi-blend";
const send = (body: object) => ctx.api.post("/api/blog-comments").send({ postSlug: ARTICLE, website: "", ...body });
const list = (query = "") => ctx.api.get(`/api/admin/messages${query}`).set(auth);

/** A message sent through the public form, as its id. */
async function sendMessage(body: object = {}) {
  await send({ name: "Asha", email: "asha@example.com", comment: "Loved this article!", ...body }).expect(201);
  return String((await BlogComment.findOne().sort({ createdAt: -1 }).lean())!._id);
}

describe("the admin's Messages screen", () => {
  it("needs an admin login", async () => {
    await ctx.api.get("/api/admin/messages").expect(401);
    await ctx.api.patch("/api/admin/messages/aaaaaaaaaaaaaaaaaaaaaaaa").send({ isRead: true }).expect(401);
    await ctx.api.delete("/api/admin/messages/aaaaaaaaaaaaaaaaaaaaaaaa").expect(401);
    await ctx.api.post("/api/admin/messages/bulk").send({ ids: ["aaaaaaaaaaaaaaaaaaaaaaaa"], action: "delete" }).expect(401);
  });

  it("starts empty", async () => {
    const res = await list().expect(200);
    expect(res.body).toMatchObject({ items: [], total: 0, pages: 1, counts: { all: 0, new: 0, read: 0 } });
  });

  it("lists what visitors send through the form, newest first, as new messages", async () => {
    await sendMessage({ name: "Asha", comment: "First one" });
    await sendMessage({ name: "Ravi", email: "ravi@example.com", website: "ravi.in", comment: "Second one", postSlug: OTHER_ARTICLE });

    const res = await list().expect(200);
    expect(res.body.counts).toEqual({ all: 2, new: 2, read: 0 });
    expect(res.body.items.map((item: { name: string }) => item.name)).toEqual(["Ravi", "Asha"]);
    expect(res.body.items[0]).toMatchObject({
      name: "Ravi",
      email: "ravi@example.com",
      website: "https://ravi.in",
      comment: "Second one",
      postSlug: OTHER_ARTICLE,
      isRead: false,
    });
    expect(res.body.items[0].id).toMatch(/^[a-f0-9]{24}$/);
    expect(res.body.items[0].createdAt).toBeTruthy();
  });

  it("doesn't list a message that a robot sent (the hidden box was filled in)", async () => {
    await send({ name: "Bot", email: "bot@example.com", comment: "Buy now", company: "Spam Co" }).expect(201);
    expect((await list().expect(200)).body.total).toBe(0);
  });

  it("marks a message as read and as new again, and the counts follow", async () => {
    const id = await sendMessage();
    const read = await ctx.api.patch(`/api/admin/messages/${id}`).set(auth).send({ isRead: true }).expect(200);
    expect(read.body.message).toMatchObject({ id, isRead: true });
    expect((await list().expect(200)).body.counts).toEqual({ all: 1, new: 0, read: 1 });

    await ctx.api.patch(`/api/admin/messages/${id}`).set(auth).send({ isRead: false }).expect(200);
    expect((await list().expect(200)).body.counts).toEqual({ all: 1, new: 1, read: 0 });

    await ctx.api.patch(`/api/admin/messages/${id}`).set(auth).send({ isRead: "yes" }).expect(400);
    await ctx.api.patch(`/api/admin/messages/${id}`).set(auth).send({}).expect(400);
  });

  it("filters by new / read and searches name, email, website, message and article", async () => {
    const first = await sendMessage({ name: "Asha", comment: "About retinol" });
    await sendMessage({ name: "Ravi", email: "ravi@example.com", comment: "About hair oil", postSlug: OTHER_ARTICLE });
    await ctx.api.patch(`/api/admin/messages/${first}`).set(auth).send({ isRead: true }).expect(200);

    const onlyNew = (await list("?status=new").expect(200)).body;
    expect(onlyNew.items.map((item: { name: string }) => item.name)).toEqual(["Ravi"]);
    expect(onlyNew.counts).toEqual({ all: 2, new: 1, read: 1 }); // the tab counts don't shrink with the filter
    expect((await list("?status=read").expect(200)).body.items.map((item: { name: string }) => item.name)).toEqual(["Asha"]);

    expect((await list("?search=retinol").expect(200)).body.total).toBe(1);
    expect((await list("?search=ravi%40example").expect(200)).body.total).toBe(1);
    expect((await list("?search=spa-luxury").expect(200)).body.total).toBe(1); // by article address
    expect((await list("?search=nothing-like-this").expect(200)).body.total).toBe(0);
    await list("?status=bogus").expect(400);
  });

  it("pages the list", async () => {
    for (let n = 1; n <= 3; n++) await sendMessage({ name: `Person ${n}`, comment: `Message ${n}` });
    const page1 = (await list("?limit=2&page=1").expect(200)).body;
    expect(page1).toMatchObject({ total: 3, pages: 2, page: 1 });
    expect(page1.items).toHaveLength(2);
    expect((await list("?limit=2&page=2").expect(200)).body.items).toHaveLength(1);
  });

  it("deletes one message for good", async () => {
    const id = await sendMessage();
    await ctx.api.delete(`/api/admin/messages/${id}`).set(auth).expect(204);
    expect(await BlogComment.countDocuments()).toBe(0);
    await ctx.api.delete(`/api/admin/messages/${id}`).set(auth).expect(404);
    await ctx.api.patch(`/api/admin/messages/${id}`).set(auth).send({ isRead: true }).expect(404);
    await ctx.api.delete("/api/admin/messages/not-an-id").set(auth).expect(404);
  });

  it("works on several messages at once", async () => {
    const ids: string[] = [];
    for (const name of ["A", "B", "C"]) ids.push(await sendMessage({ name }));

    const read = await ctx.api.post("/api/admin/messages/bulk").set(auth).send({ ids: ids.slice(0, 2), action: "read" }).expect(200);
    expect(read.body).toEqual({ updated: 2 });
    expect((await list().expect(200)).body.counts).toEqual({ all: 3, new: 1, read: 2 });

    await ctx.api.post("/api/admin/messages/bulk").set(auth).send({ ids, action: "unread" }).expect(200);
    expect((await list().expect(200)).body.counts).toEqual({ all: 3, new: 3, read: 0 });

    const removed = await ctx.api.post("/api/admin/messages/bulk").set(auth).send({ ids, action: "delete" }).expect(200);
    expect(removed.body).toEqual({ updated: 3 });
    expect(await BlogComment.countDocuments()).toBe(0);

    await ctx.api.post("/api/admin/messages/bulk").set(auth).send({ ids: [], action: "delete" }).expect(400);
    await ctx.api.post("/api/admin/messages/bulk").set(auth).send({ ids: ["nope"], action: "delete" }).expect(400);
    await ctx.api.post("/api/admin/messages/bulk").set(auth).send({ ids, action: "explode" }).expect(400);
  });
});
