import Image from "next/image";
import { Footer } from "@/components/Footer";

export type PolicySection = {
  heading: string;
  /** A bulleted list ... */
  items?: string[];
  /** ... or one plain line. */
  text?: string;
};

// A written policy page (shipping, refunds, privacy ...): gold title, an optional opening
// paragraph, then headed blocks of bullets or one line, on the cream silk photo. Spacing follows the
// live pages:
// `gapAfterList` / `gapAfterText` are the space between a bulleted block / a plain line (or the
// opening paragraph) and the next heading; they differ a little from page to page there.
// `bigTitle` is the large title the privacy page has.
export function PolicyPage({
  title,
  intro,
  sections,
  gapAfterList = 54,
  gapAfterText = 31,
  bigTitle = false,
}: {
  title: string;
  intro?: string;
  sections: PolicySection[];
  gapAfterList?: number;
  gapAfterText?: number;
  bigTitle?: boolean;
}) {
  return (
    <>
      <main>
        <section className="relative overflow-hidden bg-[#fbf3dd]">
          <Image
            // The file name has a space in it.
            src={encodeURI("/bhumi shipping.jpeg")}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            // A 100 KB jpeg: served as-is so it isn't re-compressed.
            unoptimized
            className="object-cover object-center"
          />

          <div className="relative mx-auto max-w-[1348px] px-6 py-14 sm:py-20">
            <h1
              className={
                bigTitle
                  ? "mb-[10px] font-serif text-[32px] leading-[1.2] font-bold text-[#C89B3C] sm:text-[40px]"
                  : "mb-[27px] font-serif text-[20px] leading-snug font-semibold text-[#C89B3C]"
              }
            >
              {title}
            </h1>

            {intro && (
              <p className="font-system text-[15px] leading-[1.6] text-[#1f2937]">{intro}</p>
            )}

            {sections.map((section, index) => (
              <div
                key={section.heading}
                style={
                  index === 0 && !intro
                    ? undefined
                    : {
                        marginTop:
                          index > 0 && sections[index - 1].items ? gapAfterList : gapAfterText,
                      }
                }
              >
                <h2 className="mb-[11px] font-system text-[20px] leading-[1.4] font-bold text-[#111827]">
                  {section.heading}
                </h2>
                {section.items ? (
                  <ul className="list-disc pl-[22px] font-system text-[15px] leading-[1.6] text-[#1f2937]">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-system text-[15px] leading-[1.6] text-[#1f2937]">
                    {section.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
