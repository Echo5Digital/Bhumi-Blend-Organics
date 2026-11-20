import { useState, type ReactNode } from "react";
import { Field } from "./ui";
import { DescriptionEditor } from "./DescriptionEditor";
import { ImageField } from "./ImageField";
import { newFaq, type ContentError, type ContentTab, type PageContent } from "../lib/pageContent";

// The product page's three tabs as plain forms; turning the stored page content into these
// text boxes (and back) lives in lib/pageContent.ts.

// ---- small helpers for the repeating rows ----
function change<T>(rows: T[], index: number, patch: Partial<T>): T[] {
  return rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
}
function move<T>(rows: T[], index: number, by: -1 | 1): T[] {
  const target = index + by;
  if (target < 0 || target >= rows.length) return rows;
  const next = [...rows];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
const without = <T,>(rows: T[], index: number) => rows.filter((_, i) => i !== index);

type RowToolsProps = { index: number; count: number; onMove: (by: -1 | 1) => void; onRemove: () => void };

function RowTools({ index, count, onMove, onRemove }: RowToolsProps) {
  return (
    <span className="row-tools">
      <button type="button" className="link-button" disabled={index === 0} onClick={() => onMove(-1)}>
        Move up
      </button>
      <button type="button" className="link-button" disabled={index === count - 1} onClick={() => onMove(1)}>
        Move down
      </button>
      <button type="button" className="link-button danger" onClick={onRemove}>
        Remove
      </button>
    </span>
  );
}

function RowCard({ title, children, ...tools }: { title: string; children: ReactNode } & RowToolsProps) {
  return (
    <div className="row-card">
      <div className="row-head">
        <span>{title}</span>
        <RowTools {...tools} />
      </div>
      <div className="stack">{children}</div>
    </div>
  );
}

function SubHead({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="sub-head">
      <h3>{children}</h3>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

const TABS: { id: ContentTab; label: string }[] = [
  { id: "description", label: "Description" },
  { id: "usage", label: "Usage Instructions" },
  { id: "faq", label: "FAQ" },
];

export function PageContentEditor({ value, onChange, tab, onTab, error, onBusy }: { value: PageContent; onChange: (update: (current: PageContent) => PageContent) => void; tab: ContentTab; onTab: (tab: ContentTab) => void; error: ContentError; /** Tells the form while a description photo is being uploaded. */ onBusy?: (busy: boolean) => void }) {
  // Changes are applied to the latest content (an upload can finish after other boxes were edited).
  const set = (patch: Partial<PageContent>) => onChange((current) => ({ ...current, ...patch }));
  const [showOther, setShowOther] = useState(false);
  // Which FAQ cards are open for editing (kept here so switching tabs doesn't close them).
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set());
  const toggleFaq = (key: string) => {
    const next = new Set(openFaqs);
    if (!next.delete(key)) next.add(key);
    setOpenFaqs(next);
  };
  const otherOpen = showOther || error?.tab === "other";
  const tabError = error && error.tab === tab ? error.text : null;

  return (
    <section className="card">
      <div className="card-head">
        <h2>Product page content</h2>
      </div>
      <div className="body">
        <p className="hint" style={{ marginTop: 0 }}>
          Shown on the product page, under the buy buttons, as the Description, Usage Instructions and FAQ tabs (the Reviews tab is added by itself). Type plain text. A tab with nothing in it is left out of the page.
        </p>
      </div>
      <nav className="nav-tabs content-tabs" role="tablist" aria-label="Product page tabs">
        {TABS.map((entry) => (
          <button key={entry.id} type="button" role="tab" id={`content-tab-${entry.id}`} aria-selected={tab === entry.id} aria-controls={`content-panel-${entry.id}`} className={tab === entry.id ? "active" : ""} onClick={() => onTab(entry.id)}>
            {entry.label}
          </button>
        ))}
      </nav>

      <div className="body" role="tabpanel" id={`content-panel-${tab}`} aria-labelledby={`content-tab-${tab}`}>
        {tabError && <p className="field-error" role="alert" style={{ margin: "0 0 12px", fontSize: 13 }}>{tabError}</p>}

        {tab === "description" && (
          <div className="stack">
            <Field label="Small heading above the text (optional)" htmlFor="pc-desc-heading">
              <input id="pc-desc-heading" type="text" value={value.descriptionHeading} onChange={(event) => set({ descriptionHeading: event.target.value })} />
            </Field>
            <DescriptionEditor description={value.description} photos={value.descriptionPhotos} onChange={onChange} onBusy={onBusy} />

            <SubHead hint="Cards with a photo, a name and a text, one under the other: the ingredients, or anything else you want to show off.">Photo cards</SubHead>
            <div className="field-grid">
              <Field label="Small heading above the cards (optional)" htmlFor="pc-ing-eyebrow">
                <input id="pc-ing-eyebrow" type="text" placeholder="e.g. WHAT'S INSIDE" value={value.ingredientsEyebrow} onChange={(event) => set({ ingredientsEyebrow: event.target.value })} />
              </Field>
              <Field label="Heading above the cards (optional)" htmlFor="pc-ing-title">
                <input id="pc-ing-title" type="text" placeholder="e.g. Nature's finest ingredients" value={value.ingredientsTitle} onChange={(event) => set({ ingredientsTitle: event.target.value })} />
              </Field>
            </div>
            {value.ingredients.map((row, index) => (
              <RowCard key={index} title={`Card ${index + 1}`} index={index} count={value.ingredients.length} onMove={(by) => set({ ingredients: move(value.ingredients, index, by) })} onRemove={() => set({ ingredients: without(value.ingredients, index) })}>
                <ImageField label="Photo" image={row.image ? { url: row.image } : null} onChange={(image) => set({ ingredients: change(value.ingredients, index, { image: image?.url ?? "" }) })} />
                <div className="field-grid">
                  <Field label="Name" htmlFor={`pc-ing-name-${index}`}>
                    <input id={`pc-ing-name-${index}`} type="text" value={row.name} onChange={(event) => set({ ingredients: change(value.ingredients, index, { name: event.target.value }) })} />
                  </Field>
                  <Field label="Where it's from (optional)" htmlFor={`pc-ing-origin-${index}`} hint="Shown in brackets after the name.">
                    <input id={`pc-ing-origin-${index}`} type="text" value={row.origin} onChange={(event) => set({ ingredients: change(value.ingredients, index, { origin: event.target.value }) })} />
                  </Field>
                  <div className="full">
                    <Field label="Label above the name (optional)" htmlFor={`pc-ing-tag-${index}`} hint="Shown with the card's number, e.g. “Kerala Cultivation”. Use this or the place above, not both.">
                      <input id={`pc-ing-tag-${index}`} type="text" value={row.tag} onChange={(event) => set({ ingredients: change(value.ingredients, index, { tag: event.target.value }) })} />
                    </Field>
                  </div>
                </div>
                <Field label="Text" htmlFor={`pc-ing-text-${index}`}>
                  <textarea id={`pc-ing-text-${index}`} rows={4} value={row.text} onChange={(event) => set({ ingredients: change(value.ingredients, index, { text: event.target.value }) })} />
                </Field>
              </RowCard>
            ))}
            <div>
              <button type="button" className="btn" onClick={() => set({ ingredients: [...value.ingredients, { name: "", origin: "", tag: "", image: "", text: "" }] })}>
                + Add a photo card
              </button>
            </div>

            <SubHead hint="A tick-list of the main benefits, after the description.">Key benefits (optional)</SubHead>
            <Field label="Title" htmlFor="pc-ben-title">
              <input id="pc-ben-title" type="text" value={value.benefitsTitle} onChange={(event) => set({ benefitsTitle: event.target.value })} />
            </Field>
            <Field label="Points" htmlFor="pc-ben-points" hint="One point per line.">
              <textarea id="pc-ben-points" rows={5} value={value.benefitsPoints} onChange={(event) => set({ benefitsPoints: event.target.value })} />
            </Field>
            <Field label="Closing text (optional)" htmlFor="pc-ben-outro">
              <textarea id="pc-ben-outro" rows={3} value={value.benefitsOutro} onChange={(event) => set({ benefitsOutro: event.target.value })} />
            </Field>

            <SubHead hint="A short, highlighted card, e.g. about the brand's philosophy.">Highlighted statement (optional)</SubHead>
            <Field label="Title" htmlFor="pc-st-title">
              <input id="pc-st-title" type="text" value={value.statementTitle} onChange={(event) => set({ statementTitle: event.target.value })} />
            </Field>
            <Field label="Text" htmlFor="pc-st-text" hint="Leave a blank line between paragraphs. The first one is shown larger.">
              <textarea id="pc-st-text" rows={5} value={value.statementText} onChange={(event) => set({ statementText: event.target.value })} />
            </Field>
          </div>
        )}

        {tab === "usage" && (
          <div className="stack">
            <div className="field-grid">
              <Field label="Small heading (optional)" htmlFor="pc-use-eyebrow" hint="Shown in capitals above the title.">
                <input id="pc-use-eyebrow" type="text" placeholder="e.g. BHUMI BLEND · ORGANIC BODY LOTION" value={value.usageEyebrow} onChange={(event) => set({ usageEyebrow: event.target.value })} />
              </Field>
              <Field label="Title" htmlFor="pc-use-title" hint="“How to use” when left empty.">
                <input id="pc-use-title" type="text" placeholder="How to use" value={value.usageTitle} onChange={(event) => set({ usageTitle: event.target.value })} />
              </Field>
            </div>

            <SubHead hint="Numbered automatically, in this order.">Steps</SubHead>
            {value.steps.map((row, index) => (
              <RowCard key={index} title={`Step ${index + 1}`} index={index} count={value.steps.length} onMove={(by) => set({ steps: move(value.steps, index, by) })} onRemove={() => set({ steps: without(value.steps, index) })}>
                <Field label="Step name" htmlFor={`pc-step-label-${index}`} hint="Shown in capitals, e.g. Cleanse.">
                  <input id={`pc-step-label-${index}`} type="text" value={row.label} onChange={(event) => set({ steps: change(value.steps, index, { label: event.target.value }) })} />
                </Field>
                <Field label="What to do" htmlFor={`pc-step-text-${index}`}>
                  <textarea id={`pc-step-text-${index}`} rows={2} value={row.text} onChange={(event) => set({ steps: change(value.steps, index, { text: event.target.value }) })} />
                </Field>
              </RowCard>
            ))}
            <div>
              <button type="button" className="btn" onClick={() => set({ steps: [...value.steps, { label: "", text: "" }] })}>
                + Add a step
              </button>
            </div>

            <SubHead hint="A highlighted note under the steps.">Tip (optional)</SubHead>
            <div className="field-grid">
              <Field label="Heading" htmlFor="pc-tip-label" hint="“Tip” when left empty.">
                <input id="pc-tip-label" type="text" placeholder="Tip" value={value.tipLabel} onChange={(event) => set({ tipLabel: event.target.value })} />
              </Field>
              <div className="full">
                <Field label="Text" htmlFor="pc-tip">
                  <textarea id="pc-tip" rows={3} value={value.tip} onChange={(event) => set({ tip: event.target.value })} />
                </Field>
              </div>
            </div>

            <SubHead hint="A short guide to each product in a kit or set.">Product guide (optional)</SubHead>
            <Field label="Title" htmlFor="pc-guide-title">
              <input id="pc-guide-title" type="text" value={value.guideTitle} onChange={(event) => set({ guideTitle: event.target.value })} />
            </Field>
            {value.guideItems.map((row, index) => (
              <RowCard key={index} title={`Item ${index + 1}`} index={index} count={value.guideItems.length} onMove={(by) => set({ guideItems: move(value.guideItems, index, by) })} onRemove={() => set({ guideItems: without(value.guideItems, index) })}>
                <Field label="Name" htmlFor={`pc-guide-name-${index}`}>
                  <input id={`pc-guide-name-${index}`} type="text" value={row.name} onChange={(event) => set({ guideItems: change(value.guideItems, index, { name: event.target.value }) })} />
                </Field>
                <Field label="Text" htmlFor={`pc-guide-text-${index}`}>
                  <textarea id={`pc-guide-text-${index}`} rows={2} value={row.text} onChange={(event) => set({ guideItems: change(value.guideItems, index, { text: event.target.value }) })} />
                </Field>
              </RowCard>
            ))}
            <div>
              <button type="button" className="btn" onClick={() => set({ guideItems: [...value.guideItems, { name: "", text: "" }] })}>
                + Add an item
              </button>
            </div>

            <SubHead hint="A tick-list of who the product is for.">“Suitable for” list (optional)</SubHead>
            <Field label="Title" htmlFor="pc-suit-title">
              <input id="pc-suit-title" type="text" value={value.suitableTitle} onChange={(event) => set({ suitableTitle: event.target.value })} />
            </Field>
            <Field label="Introduction" htmlFor="pc-suit-intro">
              <textarea id="pc-suit-intro" rows={2} value={value.suitableIntro} onChange={(event) => set({ suitableIntro: event.target.value })} />
            </Field>
            <Field label="Points" htmlFor="pc-suit-points" hint="One point per line.">
              <textarea id="pc-suit-points" rows={5} value={value.suitablePoints} onChange={(event) => set({ suitablePoints: event.target.value })} />
            </Field>
            <Field label="Closing text (optional)" htmlFor="pc-suit-outro">
              <textarea id="pc-suit-outro" rows={2} value={value.suitableOutro} onChange={(event) => set({ suitableOutro: event.target.value })} />
            </Field>
          </div>
        )}

        {tab === "faq" && (
          <div className="stack">
            {/* The same look as the product page's FAQ: a title with a gold rule, then one rounded card per question. */}
            <div>
              <h3 className="faq-title">Frequently asked questions</h3>
              <span className="faq-rule" aria-hidden="true" />
              <p className="hint">On the page each question opens to show its answer. Click a question here to edit it.</p>
            </div>
            <div className="faq-list">
              {value.faqs.map((row, index) => {
                // A question that still lacks its text, after a failed save, is opened so it can be fixed.
                const incomplete = error?.tab === "faq" && Boolean(row.question.trim()) !== Boolean(row.answer.trim());
                const open = openFaqs.has(row.key) || incomplete;
                return (
                  <div key={row.key} className={`faq-item${open ? " open" : ""}`}>
                    <button type="button" className="faq-head" aria-expanded={open} aria-controls={`pc-faq-body-${row.key}`} onClick={() => toggleFaq(row.key)}>
                      <span className={row.question.trim() ? "" : "faq-empty"}>{row.question.trim() || "New question"}</span>
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="faq-chevron">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    {open && (
                      <div className="faq-body stack" id={`pc-faq-body-${row.key}`}>
                        <Field label="Question" htmlFor={`pc-faq-q-${row.key}`}>
                          <input id={`pc-faq-q-${row.key}`} type="text" value={row.question} onChange={(event) => set({ faqs: change(value.faqs, index, { question: event.target.value }) })} />
                        </Field>
                        <Field label="Answer" htmlFor={`pc-faq-a-${row.key}`}>
                          <textarea id={`pc-faq-a-${row.key}`} rows={3} value={row.answer} onChange={(event) => set({ faqs: change(value.faqs, index, { answer: event.target.value }) })} />
                        </Field>
                        <div className="faq-tools">
                          <RowTools index={index} count={value.faqs.length} onMove={(by) => set({ faqs: move(value.faqs, index, by) })} onRemove={() => set({ faqs: without(value.faqs, index) })} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const added = newFaq();
                  set({ faqs: [...value.faqs, added] });
                  setOpenFaqs(new Set(openFaqs).add(added.key));
                }}
              >
                + Add a question
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="body" style={{ borderTop: "1px solid var(--line)" }}>
        <button type="button" className="link-button" aria-expanded={otherOpen} onClick={() => setShowOther(!otherOpen)}>
          {otherOpen ? "Hide" : "Show"} other page content (advanced)
        </button>
        {otherOpen && (
          <div style={{ marginTop: 10 }}>
            <p className="hint" style={{ marginTop: 0 }}>
              Everything else on the product page that these tabs don't cover (the tagline, highlights, “Why choose” points, badges, related products) is kept here as JSON. Edit it carefully, or leave it alone.
            </p>
            <textarea
              aria-label="Other product page content as JSON"
              rows={12}
              spellCheck={false}
              value={value.other}
              className={error?.tab === "other" ? "invalid" : ""}
              style={{ fontFamily: "ui-monospace, Consolas, monospace", fontSize: 12 }}
              onChange={(event) => set({ other: event.target.value })}
            />
            {error?.tab === "other" && <p className="field-error">{error.text}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
