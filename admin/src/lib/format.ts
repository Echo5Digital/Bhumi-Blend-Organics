// Small display helpers shared by every screen.

const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
const rupeesCompact = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-IN");

/** ₹1,198.00 */
export const money = (value: number) => rupees.format(value);
/** ₹1,198 — for chart axes and tight spaces. */
export const moneyShort = (value: number) => rupeesCompact.format(value);
export const count = (value: number) => number.format(value);

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const dateOnly = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export const formatDateTime = (iso?: string) => (iso ? dateTime.format(new Date(iso)) : "—");
export const formatDate = (iso?: string) => (iso ? dateOnly.format(new Date(iso)) : "—");
export const formatShortDate = (iso: string) => shortDate.format(new Date(iso));

/** "3 hours ago" for recent things, the date for older ones (like the orders list on WordPress). */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "min" : "mins"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  return formatDate(iso);
}

/** A YYYY-MM-DD in Indian time for a Date. */
export const toDayString = (date: Date) => new Date(date.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);

export function addDays(day: string, delta: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

/** "2026-02-11" → "11 Feb", "2026-02" → "Feb 2026". */
export function formatPoint(key: string): string {
  if (key.length === 7) {
    return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${key}-01T00:00:00Z`));
  }
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`));
}

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending payment",
  processing: "Processing",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
};
