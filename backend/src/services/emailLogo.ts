import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RenderContext } from "./emailParts.js";
import type { MailAttachment } from "./mailer.js";

// The shop's logo (bb_logo_.png, a copy of the one in the storefront's public folder) carried INSIDE every
// email (welcome, new order, order received), so it shows whatever the shop's web address is: a local one (http://localhost:3000) can't be
// reached by someone's mail app, and some mail apps hide pictures loaded from a website.
//
// The file is looked for in backend/assets, from the folder the server was started in and from next to
// this source file. If it isn't found the email simply falls back to its text logo.

export const LOGO_CID = "bb-logo";

const candidates = [path.resolve(process.cwd(), "assets", "bb_logo_.png"), fileURLToPath(new URL("../../assets/bb_logo_.png", import.meta.url))];

let cached: Buffer | null | undefined;

/** The logo picture, or null if the file can't be found. Read once. */
export function logoImage(): Buffer | null {
  if (cached !== undefined) return cached;
  cached = null;
  for (const file of candidates) {
    try {
      cached = readFileSync(file);
      break;
    } catch {
      // try the next place
    }
  }
  return cached;
}

/** The logo as an email attachment (what `<img src="cid:bb-logo">` points at), or null if there is no logo file. */
export function logoAttachment(): MailAttachment | null {
  const content = logoImage();
  return content ? { filename: "bb_logo_.png", content, cid: LOGO_CID, contentType: "image/png" } : null;
}

/**
 * The shop's details for rendering an email, set up to show the embedded logo, and the logo to attach to the
 * message. (With no logo file the email is left as it was and keeps its text logo.) Every email calls this
 * first, so they all carry the same logo.
 */
export function withLogo(shop: RenderContext): { context: RenderContext; attachments?: MailAttachment[] } {
  const logo = logoAttachment();
  return logo ? { context: { ...shop, inlineLogo: true, logoHeight: 84 }, attachments: [logo] } : { context: shop };
}

/** For a preview in a browser: the same HTML with each `cid:` picture replaced by the picture itself. */
export function inlineAttachments(html: string, attachments: MailAttachment[] | undefined): string {
  return (attachments ?? []).reduce((page, file) => page.replaceAll(`cid:${file.cid}`, `data:${file.contentType};base64,${file.content.toString("base64")}`), html);
}
