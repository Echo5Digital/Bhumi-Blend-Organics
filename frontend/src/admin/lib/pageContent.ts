// The product page's three tabs (Description, Usage Instructions, FAQ) as plain forms.
// The page stores them as one JSON object (`details`); this file turns that object into
// text boxes and repeating rows, and back again when the product is saved. Everything the
// forms don't manage (the top of the page: extra gallery photos, tagline, highlights, "Why
// choose" points, the five badges, related products ...) is kept as it is in `other`.

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

export type PageContent = {
  // Description tab
  descriptionHeading: string;
  /** Paragraphs, separated by a blank line. */
  description: string;
  descriptionImage: string;
  /** The photo's description for screen readers; kept while the photo stays the same, else the product name is used. */
  descriptionImageAlt: string;
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
const MANAGED = ["description", "descriptionHeading", "descriptionImage", "keyBenefits", "philosophy", "ingredientsHeading", "ingredients", "usage", "faqs"];

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown) => (typeof value === "string" ? value : "");
const objects = (value: unknown) => (Array.isArray(value) ? value.filter(isObject) : []);
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []);
const asObject = (value: unknown): Record<string, unknown> => (isObject(value) ? value : {});

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
  return {
    descriptionHeading: text(d.descriptionHeading),
    description: strings(d.description).join("\n\n"),
    descriptionImage: text(asObject(d.descriptionImage).src),
    descriptionImageAlt: text(asObject(d.descriptionImage).alt),
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

  // ---- Description tab ----
  const description = splitParagraphs(content.description);
  if (description.length > 0) details.description = description;
  if (content.descriptionHeading.trim()) details.descriptionHeading = content.descriptionHeading.trim();
  if (content.descriptionImage.trim()) details.descriptionImage = { src: content.descriptionImage.trim(), alt: content.descriptionImageAlt.trim() || productName };

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

