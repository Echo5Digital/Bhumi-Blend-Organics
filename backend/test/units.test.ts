import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env.js";
import { normalizePhone } from "../src/lib/validation.js";
import { toUpdate } from "../src/lib/updates.js";
import { videoPoster } from "../src/services/images.js";
import { collectLocalImagePaths, publicIdFor, replaceLocalImagePaths } from "../scripts/lib/image-paths.js";

const goodEnv = {
  MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/bhumiblend",
  JWT_SECRET: "x".repeat(32),
};

describe("environment settings", () => {
  it("accepts the minimum and fills in defaults", () => {
    const env = loadEnv(goodEnv);
    expect(env).toMatchObject({ PORT: 4000, NODE_ENV: "development", TRUST_PROXY: 0, CLOUDINARY_FOLDER: "bhumiblend", JWT_EXPIRES_IN: "12h" });
    expect(env.CLIENT_ORIGINS).toEqual(["http://localhost:3000"]);
    expect(env.RAZORPAY_KEY_ID).toBeUndefined();
  });

  it("treats empty KEY= lines as not set, and tidies the origin list", () => {
    const env = loadEnv({ ...goodEnv, CLOUDINARY_API_KEY: "", RAZORPAY_KEY_ID: "  ", CLIENT_ORIGINS: "https://shop.example.com/, http://localhost:3001 ," });
    expect(env.CLOUDINARY_API_KEY).toBeUndefined();
    expect(env.RAZORPAY_KEY_ID).toBeUndefined();
    expect(env.CLIENT_ORIGINS).toEqual(["https://shop.example.com", "http://localhost:3001"]);
  });

  it("stops with a plain message when the database link or secret is missing or weak", () => {
    expect(() => loadEnv({})).toThrow(/MONGODB_URI is missing/);
    expect(() => loadEnv({ ...goodEnv, MONGODB_URI: "" })).toThrow(/MONGODB_URI is empty|must start with mongodb/);
    expect(() => loadEnv({ ...goodEnv, MONGODB_URI: "http://nope" })).toThrow(/must start with mongodb/);
    expect(() => loadEnv({ ...goodEnv, JWT_SECRET: "short" })).toThrow(/at least 32 characters/);
    expect(() => loadEnv({ ...goodEnv, PORT: "banana" })).toThrow(/PORT/);
  });
});

describe("phone numbers", () => {
  it.each([
    ["98765 43210", "9876543210"],
    ["+91 98765-43210", "9876543210"],
    ["919876543210", "9876543210"],
    ["09876543210", "9876543210"],
    ["(98765) 43210", "9876543210"],
  ])("normalises %s", (input, expected) => expect(normalizePhone(input)).toBe(expected));
});

describe("PATCH helper", () => {
  it("sets values, clears nulls and leaves out what wasn't sent", () => {
    expect(toUpdate({ price: 5, regularPrice: null, name: undefined })).toEqual({ $set: { price: 5 }, $unset: { regularPrice: "" } });
    expect(toUpdate({})).toEqual({});
  });
});

describe("video still frames", () => {
  it("swaps the file ending for .jpg, which Cloudinary answers with the first frame", () => {
    expect(videoPoster("https://res.cloudinary.com/demo/video/upload/v1/bhumiblend/clip_x1.mp4")).toBe("https://res.cloudinary.com/demo/video/upload/v1/bhumiblend/clip_x1.jpg");
    expect(videoPoster("https://res.cloudinary.com/demo/video/upload/v1/bhumiblend/clip.webm?_a=1")).toBe("https://res.cloudinary.com/demo/video/upload/v1/bhumiblend/clip.jpg?_a=1");
  });
});

describe("moving photos to Cloudinary", () => {
  const product = {
    image: { url: "/Hair-Oil.jpg" },
    details: {
      gallery: [{ src: "/Hair-Oil.jpg", alt: "x" }, { src: "/2 (1).png", alt: "y" }],
      ingredients: [{ image: "/Jasmine-Oil.jpg", text: "see /not-a-photo and https://example.com/a.jpg" }],
      link: "/shop",
    },
  };

  it("finds every local photo path, once each, and nothing else", () => {
    expect([...collectLocalImagePaths(product)].sort()).toEqual(["/2 (1).png", "/Hair-Oil.jpg", "/Jasmine-Oil.jpg"]);
  });

  it("copes with objects that contain themselves", () => {
    const loop: Record<string, unknown> = { image: "/loop.jpg" };
    loop.self = loop;
    expect([...collectLocalImagePaths(loop)]).toEqual(["/loop.jpg"]);
  });

  it("swaps paths for addresses everywhere, leaving other text alone", () => {
    const urls = new Map([
      ["/Hair-Oil.jpg", "https://cdn/hair.jpg"],
      ["/2 (1).png", "https://cdn/two.png"],
    ]);
    const result = replaceLocalImagePaths(product, urls);
    expect(result.image.url).toBe("https://cdn/hair.jpg");
    expect(result.details.gallery.map((item) => item.src)).toEqual(["https://cdn/hair.jpg", "https://cdn/two.png"]);
    expect(result.details.ingredients[0]?.image).toBe("/Jasmine-Oil.jpg"); // not in the map: untouched
    expect(result.details.link).toBe("/shop");
    expect(product.image.url).toBe("/Hair-Oil.jpg"); // the original isn't modified
  });

  it("makes safe Cloudinary ids from file names", () => {
    expect(publicIdFor("/Hair-Oil-2_03-1 (1).jpg")).toBe("Hair-Oil-2_03-1-1");
    expect(publicIdFor("/2 (1).png")).toBe("2-1");
    expect(publicIdFor("/Face-serum-2_01-500x669.jpg")).toBe("Face-serum-2_01-500x669");
  });
});
