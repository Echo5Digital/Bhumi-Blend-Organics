// The product page's three tabs (Description, Usage Instructions, FAQ) and its photo/video
// gallery as plain forms. The page stores them as one JSON object (`details`); this file turns
// that object into text boxes and repeating rows, and back again when the product is saved.
// Everything the forms don't manage (the top of the page: tagline, highlights, "Why choose"
// points, the five badges, related products ...) is kept as it is in `other`.

export type ContentTab = "description" | "usage" | "faq";
/** What to fix before saving, and where: one of the tabs, or the advanced JSON box. */
export type ContentProblem = { tab: ContentTab | "other"; text: string };
export type ContentError = ContentProblem | null;

type Ingredient = { name: string; origin: string; tag: string; image: string; text: string };
type Step = { label: string; text: string };
type GuideItem = { name: string; text: string };
/** `key` only identifies a row on screen (which one is open, after a move); it is never stored. */
export type Faq = { key: string; question: string; answer: string };

let lastKey = 0;
export function newFaq(): Faq {
  return { key: `faq-${++lastKey}`, question: "", answer: "" };
}

/**
 * One photo or video of the product page's gallery. `poster` is a video's still frame and `fit` keeps
 * a square picture whole instead of cropped; both are only carried along. `key` is never stored.
 */
export type GalleryItem = { key: string; src: string; alt: string; kind?: "video"; poster?: string; fit?: "contain" };

export function newGalleryItem(item: Omit<GalleryItem, "key">): GalleryItem {
  return { key: `media-${++lastKey}`, ...item };
}

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogv|ogg|m4v)(\?|#|$)/i;
/** Whether a pasted address looks like a video file. */
export const looksLikeVideo = (address: string) => VIDEO_EXTENSIONS.test(address.trim());

/**
 * A photo inside the description. Where it shows is decided by a line `[photo N]` in the description
 * text (N = `n`); a photo with no such line is not on the page. `width`/`height` (known for uploads)
 * let the page show it uncropped; without them it gets the wide frame. `legacy` marks the product's
 * old single "wide photo under the description", which is saved back the old way while it stays last.
 */
export type DescriptionPhoto = { n: number; src: string; alt: string; width?: number; height?: number; legacy?: boolean };

const MARKER = /^\[photo\s+(\d+)\]$/i;
const MARKER_ANYWHERE = /\[photo\s+\d+\]/i;
export const photoMarker = (n: number) => `[photo ${n}]`;
const isMarkerFor = (line: string, n: number) => MARKER.exec(line.trim())?.[1] === String(n);

/** The photo numbers that have their `[photo N]` line in the text. */
export function markerNumbers(description: string): Set<number> {
  const found = new Set<number>();
  for (const line of description.split(/\r?\n/)) {
    const match = MARKER.exec(line.trim());
    if (match) found.add(Number(match[1]));
  }
  return found;
}

/** The text without photo N's line (the photo then isn't shown). */
export function removePhotoMarker(description: string, n: number): string {
  const lines = description.split(/\r?\n/);
  const kept: string[] = [];
  lines.forEach((line, index) => {
    if (!isMarkerFor(line, n)) return void kept.push(line);
    // take a blank line with it, so the paragraphs around it aren't left with two
    const nextIsBlank = index + 1 >= lines.length || lines[index + 1].trim() === "";
    if (nextIsBlank && kept.length > 0 && kept[kept.length - 1].trim() === "") kept.pop();
  });
  return kept.join("\n");
}

/**
 * Puts photo N's line in the text at character `at`, as a paragraph of its own (a paragraph
 * cut in the middle becomes two). If the photo already has a line elsewhere, that one moves here.
 * `caret` is the position just after the new line.
 */
export function insertPhotoMarker(description: string, at: number, n: number): { text: string; caret: number } {
  const cut = Math.max(0, Math.min(at, description.length));
  const left = removePhotoMarker(description.slice(0, cut), n).replace(/\s+$/, "");
  const right = removePhotoMarker(description.slice(cut), n).replace(/^\s+/, "");
  const marker = photoMarker(n);
  const head = left ? `${left}\n\n${marker}` : marker;
  return { text: right ? `${head}\n\n${right}` : head, caret: head.length + (right ? 2 : 0) };
}

export type PageContent = {
  /** The product page's photos and video in order; null = not chosen (the page then shows the main photo, then the hover photo). */
  gallery: GalleryItem[] | null;
  // Description tab
  descriptionHeading: string;
  /** Paragraphs, separated by a blank line. A line like `[photo 2]` on its own is where photo 2 shows. */
  description: string;
  /** The photos that go inside the description, each placed by its `[photo N]` line in `description`. */
  descriptionPhotos: DescriptionPhoto[];
  benefitsTitle: string;
  /** One benefit per line. */
  benefitsPoints: string;
  benefitsOutro: string;
  statementTitle: string;
  /** Paragraphs, separated by a blank line. */
  statementText: string;
  ingredientsEyebrow: string;
  ingredientsTitle: string;
  ingredients: Ingredient[];
  // Usage Instructions tab
  usageEyebrow: string;
  usageTitle: string;
  steps: Step[];
  tipLabel: string;
  tip: string;
  guideTitle: string;
  guideItems: GuideItem[];
  suitableTitle: string;
  suitableIntro: string;
  /** One point per line. */
  suitablePoints: string;
  suitableOutro: string;
  // FAQ tab
  faqs: Faq[];
  /** The rest of the page content, as JSON text (advanced). */
  other: string;
};

/** Every key of `details` that the forms own; all other keys go to `other`. */
const MANAGED = ["gallery", "description", "descriptionHeading", "descriptionImage", "descriptionImages", "keyBenefits", "philosophy", "ingredientsHeading", "ingredients", "usage", "faqs"];

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown) => (typeof value === "string" ? value : "");
const objects = (value: unknown) => (Array.isArray(value) ? value.filter(isObject) : []);
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []);
const asObject = (value: unknown): Record<string, unknown> => (isObject(value) ? value : {});

/**
 * The description box and its photos. The page stores the paragraphs (`description`) and each photo with
 * the number of paragraphs before it (`descriptionImages`, plus the older single `descriptionImage`, which
 * always comes last). Here each photo becomes a `[photo N]` line between the paragraphs.
 */
function descriptionFromDetails(d: Record<string, unknown>): { description: string; descriptionPhotos: DescriptionPhoto[] } {
  const paragraphs = strings(d.description);
  const sized = (entry: Record<string, unknown>) => (typeof entry.width === "number" && typeof entry.height === "number" && entry.width > 0 && entry.height > 0 ? { width: entry.width, height: entry.height } : {});
  const inText = objects(d.descriptionImages)
    .filter((entry) => text(entry.src).trim() !== "")
    .map((entry) => ({
      after: typeof entry.after === "number" ? Math.max(0, Math.min(paragraphs.length, Math.floor(entry.after))) : paragraphs.length,
      src: text(entry.src),
      alt: text(entry.alt),
      ...sized(entry),
    }))
    .sort((a, b) => a.after - b.after);
  const old = asObject(d.descriptionImage);
  const legacy = text(old.src).trim() ? [{ after: paragraphs.length, src: text(old.src), alt: text(old.alt), legacy: true }] : [];
  const photos = [...inText, ...legacy].map((photo, index) => ({ ...photo, n: index + 1 }));

  const parts: string[] = [];
  for (let at = 0; at <= paragraphs.length; at++) {
    for (const photo of photos) if (photo.after === at) parts.push(photoMarker(photo.n));
    if (at < paragraphs.length) parts.push(paragraphs[at]);
  }
  return {
    description: parts.join("\n\n"),
    descriptionPhotos: photos.map(({ after, ...photo }) => (void after, photo)),
  };
}

/**
 * Reads the description box: the paragraphs, and which photos sit where (`after` = paragraphs before it).
 * Paragraphs are split by blank lines, a `[photo N]` line on its own places photo N.
 */
function parseDescription(value: string, photos: DescriptionPhoto[]): { paragraphs: string[]; placed: (DescriptionPhoto & { after: number })[] } | { error: string } {
  const paragraphs: string[] = [];
  const placed: (DescriptionPhoto & { after: number })[] = [];
  let current: string[] = [];
  const flush = () => {
    const paragraph = current.join("\n").trim();
    if (paragraph) paragraphs.push(paragraph);
    current = [];
  };
  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();
    const marker = MARKER.exec(trimmed);
    if (marker) {
      flush();
      const n = Number(marker[1]);
      const photo = photos.find((entry) => entry.n === n);
      if (!photo) return { error: `There is no photo ${n}. Delete the line “${trimmed}” from the description, or add a photo.` };
      if (placed.some((entry) => entry.n === n)) return { error: `“${trimmed}” is in the description twice. Keep just one of them.` };
      if (!photo.src.trim()) return { error: `Photo ${n} has no picture. Add one, or remove the photo.` };
      placed.push({ ...photo, after: paragraphs.length });
    } else if (trimmed === "") {
      flush();
    } else if (MARKER_ANYWHERE.test(trimmed)) {
      return { error: `Put “${MARKER_ANYWHERE.exec(trimmed)![0]}” on a line of its own, with no other words on that line.` };
    } else {
      current.push(line);
    }
  }
  flush();
  return { paragraphs, placed };
}

/** The text boxes for a product's stored page content (null for a new product). */
export function contentFromDetails(details: Record<string, unknown> | null | undefined): PageContent {
  const d = asObject(details);
  const benefits = asObject(d.keyBenefits);
  const statement = asObject(d.philosophy);
  const heading = asObject(d.ingredientsHeading);
  const usage = asObject(d.usage);
  const guide = asObject(usage.guide);
  const suitable = asObject(usage.suitableFor);
  const rest = Object.fromEntries(Object.entries(d).filter(([key]) => !MANAGED.includes(key)));
  const gallery = objects(d.gallery)
    .filter((entry) => text(entry.src).trim() !== "")
    .map((entry) =>
      newGalleryItem({
        src: text(entry.src),
        alt: text(entry.alt),
        ...(entry.kind === "video" && { kind: "video" as const }),
        ...(text(entry.poster) && { poster: text(entry.poster) }),
        ...(entry.fit === "contain" && { fit: "contain" as const }),
      }),
    );
  return {
    gallery: gallery.length > 0 ? gallery : null,
    descriptionHeading: text(d.descriptionHeading),
    ...descriptionFromDetails(d),
    benefitsTitle: text(benefits.title),
    benefitsPoints: strings(benefits.points).join("\n"),
    benefitsOutro: text(benefits.outro),
    statementTitle: text(statement.title),
    statementText: strings(statement.paragraphs).join("\n\n"),
    ingredientsEyebrow: text(heading.eyebrow),
    ingredientsTitle: text(heading.title),
    ingredients: objects(d.ingredients).map((entry) => ({ name: text(entry.name), origin: text(entry.origin), tag: text(entry.tag), image: text(entry.image), text: text(entry.text) })),
    usageEyebrow: text(usage.eyebrow),
    usageTitle: text(usage.title),
    steps: objects(usage.steps).map((entry) => ({ label: text(entry.label), text: text(entry.text) })),
    tipLabel: text(usage.tipLabel),
    tip: text(usage.tip),
    guideTitle: text(guide.title),
    guideItems: objects(guide.items).map((entry) => ({ name: text(entry.name), text: text(entry.text) })),
    suitableTitle: text(suitable.title),
    suitableIntro: text(suitable.intro),
    suitablePoints: strings(suitable.points).join("\n"),
    suitableOutro: text(suitable.outro),
    faqs: objects(d.faqs).map((entry) => ({ ...newFaq(), question: text(entry.question), answer: text(entry.answer) })),
    other: Object.keys(rest).length > 0 ? JSON.stringify(rest, null, 2) : "",
  };
}

const splitParagraphs = (value: string) => value.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
const splitLines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);
const blank = (...values: string[]) => values.every((value) => value.trim() === "");

/** The stored page content for the text boxes, or what to fix first. Empty sections are left out. */
export function contentToDetails(content: PageContent, productName: string): { details: Record<string, unknown> | null } | { error: ContentProblem } {
  const fail = (tab: ContentTab | "other", message: string) => ({ error: { tab, text: message } });

  let details: Record<string, unknown> = {};
  if (content.other.trim()) {
    try {
      const parsed: unknown = JSON.parse(content.other);
      if (!isObject(parsed)) throw new Error("not an object");
      details = { ...parsed };
    } catch {
      return fail("other", "This isn't valid JSON. Fix it, or clear the box to leave the rest of the page content empty.");
    }
  }
  for (const key of MANAGED) delete details[key]; // the forms own these

  // ---- Gallery (photos and video above the tabs) ----
  const gallery = (content.gallery ?? []).filter((item) => item.src.trim() !== "");
  if (gallery.length > 0) {
    details.gallery = gallery.map((item) => ({
      src: item.src.trim(),
      alt: item.alt.trim() || (item.kind === "video" ? `${productName} video` : productName),
      ...(item.kind === "video" && { kind: "video" }),
      ...(item.poster?.trim() && { poster: item.poster.trim() }),
      ...(item.fit && { fit: item.fit }),
    }));
  }

  // ---- Description tab ----
  const parsed = parseDescription(content.description, content.descriptionPhotos);
  if ("error" in parsed) return fail("description", parsed.error);
  if (parsed.paragraphs.length > 0) details.description = parsed.paragraphs;
  if (content.descriptionHeading.trim()) details.descriptionHeading = content.descriptionHeading.trim();
  // A photo with no `[photo N]` line in the text isn't on the page. The product's old wide photo, while it
  // stays last, is saved the old way (so an untouched product is saved exactly as it was); the rest are
  // saved with the number of paragraphs before each.
  const lastPlaced = parsed.placed[parsed.placed.length - 1];
  const oldWide = lastPlaced?.legacy && lastPlaced.after === parsed.paragraphs.length ? lastPlaced : undefined;
  const inText = parsed.placed.filter((photo) => photo !== oldWide);
  if (inText.length > 0) {
    details.descriptionImages = inText.map((photo) => ({
      after: photo.after,
      src: photo.src.trim(),
      alt: photo.alt.trim() || productName,
      ...(photo.width && photo.height && { width: photo.width, height: photo.height }),
    }));
  }
  if (oldWide) details.descriptionImage = { src: oldWide.src.trim(), alt: oldWide.alt.trim() || productName };

  const points = splitLines(content.benefitsPoints);
  if (points.length > 0) {
    details.keyBenefits = { ...(content.benefitsTitle.trim() && { title: content.benefitsTitle.trim() }), points, ...(content.benefitsOutro.trim() && { outro: content.benefitsOutro.trim() }) };
  } else if (!blank(content.benefitsTitle, content.benefitsOutro)) {
    return fail("description", "Key benefits needs at least one point (one per line). Or clear its other boxes.");
  }

  const statement = splitParagraphs(content.statementText);
  if (!blank(content.statementTitle, content.statementText)) {
    if (!content.statementTitle.trim() || statement.length === 0) return fail("description", "The highlighted statement needs a title and some text. Or clear both.");
    details.philosophy = { title: content.statementTitle.trim(), paragraphs: statement };
  }

  if (!blank(content.ingredientsEyebrow, content.ingredientsTitle)) {
    details.ingredientsHeading = { eyebrow: content.ingredientsEyebrow.trim(), title: content.ingredientsTitle.trim() };
  }
  const ingredients: Record<string, string>[] = [];
  for (const row of content.ingredients) {
    if (blank(row.name, row.origin, row.tag, row.image, row.text)) continue;
    if (!row.name.trim()) return fail("description", "Each ingredient card needs a name.");
    ingredients.push({
      name: row.name.trim(),
      ...(row.origin.trim() && { origin: row.origin.trim() }),
      ...(row.tag.trim() && { tag: row.tag.trim() }),
      ...(row.image.trim() && { image: row.image.trim() }),
      text: row.text.trim(),
    });
  }
  if (ingredients.length > 0) details.ingredients = ingredients;

  // ---- Usage Instructions tab ----
  const steps: Step[] = [];
  for (const row of content.steps) {
    if (blank(row.label, row.text)) continue;
    if (!row.text.trim()) return fail("usage", "Each step needs its text.");
    steps.push({ label: row.label.trim(), text: row.text.trim() });
  }
  const guideItems: GuideItem[] = [];
  for (const row of content.guideItems) {
    if (blank(row.name, row.text)) continue;
    if (!row.name.trim() || !row.text.trim()) return fail("usage", "Each item of the guide needs a name and a text.");
    guideItems.push({ name: row.name.trim(), text: row.text.trim() });
  }
  const suitablePoints = splitLines(content.suitablePoints);
  const usageHasContent = steps.length > 0 || !blank(content.usageEyebrow, content.usageTitle, content.tip, content.guideTitle, content.suitableTitle, content.suitableIntro, content.suitableOutro) || guideItems.length > 0 || suitablePoints.length > 0;
  if (usageHasContent) {
    if (steps.length === 0) return fail("usage", "Add at least one step, or clear everything on this tab.");
    const usage: Record<string, unknown> = { eyebrow: content.usageEyebrow.trim(), title: content.usageTitle.trim() || "How to use", steps };
    if (content.tip.trim()) {
      usage.tip = content.tip.trim();
      if (content.tipLabel.trim()) usage.tipLabel = content.tipLabel.trim();
    }
    if (guideItems.length > 0) {
      if (!content.guideTitle.trim()) return fail("usage", "Give the product guide a title.");
      usage.guide = { title: content.guideTitle.trim(), items: guideItems };
    } else if (content.guideTitle.trim()) {
      return fail("usage", "The product guide needs at least one item. Or clear its title.");
    }
    if (suitablePoints.length > 0) {
      if (!content.suitableTitle.trim()) return fail("usage", "Give the “Suitable for” list a title.");
      usage.suitableFor = { title: content.suitableTitle.trim(), intro: content.suitableIntro.trim(), points: suitablePoints, ...(content.suitableOutro.trim() && { outro: content.suitableOutro.trim() }) };
    } else if (!blank(content.suitableTitle, content.suitableIntro, content.suitableOutro)) {
      return fail("usage", "The “Suitable for” list needs at least one point. Or clear its other boxes.");
    }
    details.usage = usage;
  }

  // ---- FAQ tab ----
  const faqs: Pick<Faq, "question" | "answer">[] = [];
  for (const row of content.faqs) {
    if (blank(row.question, row.answer)) continue;
    if (!row.question.trim() || !row.answer.trim()) return fail("faq", "Each FAQ needs both a question and an answer.");
    faqs.push({ question: row.question.trim(), answer: row.answer.trim() });
  }
  if (faqs.length > 0) details.faqs = faqs;

  return { details: Object.keys(details).length > 0 ? details : null };
}

