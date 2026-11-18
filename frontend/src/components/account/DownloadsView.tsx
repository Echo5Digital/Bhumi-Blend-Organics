import Link from "next/link";
import { primaryButton, sectionHeading } from "./ui";

// /my-account/downloads — kept because the live site's account menu has it. The
// store sells physical products only, so there is never anything to download.
export function DownloadsView() {
  return (
    <>
      <h2 className={sectionHeading}>Downloads</h2>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[3px] border border-[#eadcb6] bg-[#fbf3e0] px-5 py-4 text-[#6b4a10]">
        <p>No downloads available yet.</p>
        <Link href="/shop" className={`${primaryButton} !h-11 !px-6`}>
          Browse products
        </Link>
      </div>
    </>
  );
}
