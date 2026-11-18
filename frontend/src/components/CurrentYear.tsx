import { cacheLife } from "next/cache";

// The year only changes once a year, so cache it instead of reading the clock
// on every render (which Cache Components rejects during prerendering).
export async function CurrentYear() {
  "use cache";
  cacheLife("days");

  return <>{new Date().getFullYear()}</>;
}
