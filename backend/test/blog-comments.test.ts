import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BlogComment } from "../src/models/BlogComment.js";
import { startTestApp } from "./helpers.js";

let ctx: Awaited<ReturnType<typeof startTestApp>>;

beforeAll(async () => {
  ctx = await startTestApp({ seed: false });
});
afterAll(() => ctx.stop());
beforeEach(() => BlogComment.deleteMany({}));

const valid = {
  postSlug: "how-to-age-gracefully-restore-rejuvenate-and-glow-naturally",
  name: "  Asha  ",
  email: "Asha@Example.COM",
  website: "",
  comment: "  Loved this article!  ",
};
const send = (body: object) => ctx.api.post("/api/blog-comments").send(body);

describe("blog comments", () => {
  it("save a comment as new (unread), tidied up, and say it awaits moderation", async () => {
    const res = await send(valid).expect(201);
    expect(res.body).toEqual({ status: "pending", message: "Your comment is awaiting moderation." });

    const saved = await BlogComment.find().lean();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      postSlug: valid.postSlug,
      name: "Asha",
      email: "asha@example.com",
      website: "",
      comment: "Loved this article!",
      isRead: false,
    });
  });

  it("accept a website with or without https://", async () => {
    await send({ ...valid, website: "example.com" }).expect(201);
    await send({ ...valid, website: "https://shop.example.in/about" }).expect(201);
    const websites = (await BlogComment.find().sort({ createdAt: 1 }).lean()).map((c) => c.website);
    expect(websites).toEqual(["https://example.com", "https://shop.example.in/about"]);
  });

  it("do not need a website at all", async () => {
    const { website: _unused, ...withoutWebsite } = valid;
    await send(withoutWebsite).expect(201);
    expect((await BlogComment.findOne().lean())?.website).toBe("");
  });

  it("refuse a missing name, email or comment, and say which", async () => {
    const res = await send({ postSlug: valid.postSlug, name: "  ", email: "", comment: "" }).expect(400);
    const fields = (res.body.error.details as { path: string }[]).map((detail) => detail.path).sort();
    expect(fields).toEqual(["comment", "email", "name"]);
    expect(await BlogComment.countDocuments()).toBe(0);
  });

  it("refuse an email or website that can't be real", async () => {
    const badEmail = await send({ ...valid, email: "not-an-email" }).expect(400);
    expect(badEmail.body.error.details[0].path).toBe("email");
    const badSite = await send({ ...valid, website: "not a website" }).expect(400);
    expect(badSite.body.error.details[0].path).toBe("website");
    expect(await BlogComment.countDocuments()).toBe(0);
  });

  it("refuse a comment that is far too long, or without an article", async () => {
    await send({ ...valid, comment: "x".repeat(3001) }).expect(400);
    await send({ ...valid, postSlug: "" }).expect(400);
    await send({ ...valid, postSlug: "Not A Slug!" }).expect(400);
    expect(await BlogComment.countDocuments()).toBe(0);
  });

  it("quietly keep nothing when the hidden robot-trap box is filled in", async () => {
    await send({ ...valid, company: "Spam Co" }).expect(201);
    expect(await BlogComment.countDocuments()).toBe(0);
  });
});
