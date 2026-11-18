// Class strings shared by the /my-account pages, so every button and link looks the same.

/** The gold pill used for main actions across the site (cart, product page). */
export const primaryButton =
  "inline-flex h-[52px] cursor-pointer items-center justify-center rounded-full bg-brand-gold px-8 font-system text-[13px] font-bold tracking-[0.12em] whitespace-nowrap text-white uppercase shadow-[0_14px_24px_-12px_rgba(184,121,31,0.8)] transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-brand-gold-dark hover:shadow-[0_18px_28px_-12px_rgba(184,121,31,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

/** A quieter outlined version, for "Cancel". */
export const secondaryButton =
  "inline-flex h-[52px] cursor-pointer items-center justify-center rounded-full border border-brand-gold bg-white px-8 font-system text-[13px] font-bold tracking-[0.12em] whitespace-nowrap text-brand-gold-dark uppercase transition-colors duration-300 hover:bg-[#fbf3e0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold";

/** Gold text link (the dashboard's "recent orders", "Log out", "Edit"...). */
export const textLink =
  "cursor-pointer text-brand-gold-dark underline-offset-4 transition-colors duration-300 hover:text-brand-gold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold";

/** Heading above a section of the account area. */
export const sectionHeading = "font-serif text-[24px] leading-snug text-[#222]";

/** Red error line / box (same red as the checkout's field errors). */
export const errorBox =
  "rounded-[4px] border border-[#cc1818]/40 bg-[#fdf2f2] px-4 py-3 font-system text-[14px] leading-5 text-[#a31414]";

/** A note meant for the developer, not the shopper (dashed border so it can't be mistaken for part of the design). */
export const devNote =
  "rounded-[4px] border border-dashed border-[#8a8a8a] bg-[#f7f7f7] px-4 py-3 font-system text-[13px] leading-5 text-[#444]";

/** Green-free success note: gold-edged, in keeping with the site's white-and-gold look. */
export const successBox =
  "rounded-[4px] border border-[#eadcb6] bg-[#fbf3e0] px-4 py-3 font-system text-[14px] leading-5 text-[#6b4a10]";
