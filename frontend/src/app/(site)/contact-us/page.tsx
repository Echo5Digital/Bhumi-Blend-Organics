import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { PageSkeleton } from "@/components/PageSkeleton";
import { getContact } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Contact Us | Bhumi Blend Organics",
  description:
    "Have questions or need help? Contact Us the Bhumi Blend for inquiries about our organic beauty products and Ayurvedic skincare in India. We’re here to assist you.",
};

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "h-[18px] w-[18px] fill-none stroke-current",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function PhoneIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.82.83-3.03-.2-.31a8.2 8.2 0 1 1 6.95 3.84Zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.22-.09-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.17-.29.19-.54.06a6.7 6.7 0 0 1-3.3-2.88c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.43-.06-.12-.55-1.32-.75-1.8-.2-.47-.4-.4-.55-.41h-.47a.9.9 0 0 0-.65.3c-.22.25-.85.83-.85 2.03s.87 2.36 1 2.52c.12.16 1.7 2.6 4.12 3.65 1.53.66 2.13.72 2.9.6.47-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.17-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

// Round gold-edged badge that holds each line icon.
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand-gold-dark ring-1 ring-[#C89B3C]/45"
    >
      {children}
    </span>
  );
}

// The page's content. Its contact details come from the backend (cached), so it is
// shown behind <Suspense> below — a cold cache never blocks the page.
async function ContactContent() {
  const contact = await getContact();
  return (
    <>
      <main>
        {/* Banner: details on the page's cream at the left, the photo on the
            right fading into it from 1024px; photo on top below that. */}
        <section className="relative isolate overflow-hidden bg-brand-cream lg:h-[clamp(480px,32vw,580px)]">
          <div className="relative aspect-[16/9] w-full sm:aspect-[2/1] lg:absolute lg:inset-y-0 lg:right-0 lg:left-[42%] lg:aspect-auto lg:w-auto">
            <Image
              src="/main_bb_bnr_3-scaled.jpg"
              alt="A smiling woman resting her head on her arms beside a bottle of Bhumi Blend Rosemary Water"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              loading="eager"
              fetchPriority="high"
              // A 115 KB JPEG: served as-is so it isn't re-compressed.
              unoptimized
              className="object-cover"
              style={{ objectPosition: "62% 50%" }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand-cream to-transparent lg:hidden"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,#fcfcf5_0%,rgba(252,252,245,0.9)_10%,rgba(252,252,245,0)_28%)] lg:block"
            />
          </div>

          <div className="relative mx-auto max-w-[1290px] px-6 pt-4 pb-12 sm:pt-6 sm:pb-14 lg:flex lg:h-full lg:items-center lg:pt-0 lg:pb-0">
            <div className="w-full max-w-[540px] lg:max-w-[min(540px,42vw)]">
              <h1 className="font-serif text-[36px] leading-tight font-medium text-[#222] sm:text-[46px] lg:text-[clamp(40px,3.6vw,56px)]">
                Contact{" "}
                <span className="bg-gradient-to-r from-[#a96a12] to-[#d9a63f] bg-clip-text text-transparent">
                  Us
                </span>
              </h1>
              <span aria-hidden="true" className="mt-4 block h-[3px] w-14 rounded-full bg-brand-gold" />

              <ul className="mt-7 space-y-5">
                <li className="flex items-center gap-4">
                  <Badge>
                    <PhoneIcon />
                  </Badge>
                  <a
                    href={contact.phoneHref}
                    className="font-serif text-[26px] leading-none font-medium text-[#222] transition-colors duration-300 hover:text-brand-gold-dark sm:text-[30px]"
                  >
                    {contact.phoneLabel}
                  </a>
                </li>
                <li className="flex items-center gap-4">
                  <Badge>
                    <MailIcon />
                  </Badge>
                  <a
                    href={`mailto:${contact.email}`}
                    className="font-system text-[16px] break-all text-[#3b3226] transition-colors duration-300 hover:text-brand-gold-dark sm:text-[18px]"
                  >
                    {contact.email}
                  </a>
                </li>
                <li className="flex items-start gap-4">
                  <Badge>
                    <PinIcon />
                  </Badge>
                  <address className="font-system text-[15px] leading-7 text-[#4a4036] not-italic sm:text-[16px]">
                    <strong className="block font-sans text-[13px] leading-6 font-semibold tracking-[1.5px] text-brand-gold-dark uppercase sm:text-[14px]">
                      {contact.company}
                    </strong>
                    {contact.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Ways to reach us right now. */}
        <section
          aria-label="Call or chat with us"
          className="border-y border-[#efe5c9] bg-[#f8f4ea] px-6 py-9 text-center"
        >
          <div className="mx-auto flex max-w-[640px] flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
            <a
              href={contact.phoneHref}
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#e6bd62] to-[#C89B3C] px-8 py-3.5 font-sans text-[15px] font-semibold text-[#2a1a05] shadow-[0_14px_28px_-14px_rgba(184,121,31,0.85)] transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-105"
            >
              <PhoneIcon />
              Call Us Now
            </a>
            <a
              href={contact.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#1b9e52] px-8 py-3.5 font-sans text-[15px] font-semibold text-white shadow-[0_14px_28px_-14px_rgba(27,158,82,0.85)] transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-110"
            >
              <WhatsAppIcon />
              Chat on WhatsApp
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <p className="mt-4 font-system text-[14px] text-[#6d6459]">{contact.hours}</p>
        </section>

        <section aria-label="Our location">
          <iframe
            src={contact.mapEmbedSrc}
            title="Map showing the Bhumi Blend Organics office in Kaloor, Kochi"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="block h-[360px] w-full border-0 md:h-[460px]"
          />
        </section>
      </main>
    </>
  );
}

export default function ContactPage() {
  return (
    <>
      <Suspense fallback={<PageSkeleton className="h-[80vh]" />}>
        <ContactContent />
      </Suspense>
      <Footer />
    </>
  );
}
