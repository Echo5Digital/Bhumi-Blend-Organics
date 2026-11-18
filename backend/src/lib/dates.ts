import { z } from "zod";

// The shop runs on Indian time. "Today", "this month" and report days all mean
// IST days, whatever time zone the server itself happens to be in.

export const IST_OFFSET = "+05:30";
export const IST_ZONE = "Asia/Kolkata";

/** A calendar day as YYYY-MM-DD. */
export const dayString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-11-18.")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00${IST_OFFSET}`).getTime()), "That date doesn't exist.");

/** Midnight at the start of that IST day. */
export const startOfDay = (day: string) => new Date(`${day}T00:00:00${IST_OFFSET}`);

/** Midnight at the start of the day AFTER that IST day (use as an exclusive upper bound). */
export function startOfNextDay(day: string) {
  const next = startOfDay(day);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/** Today's date in IST, YYYY-MM-DD. */
export const todayInIst = (now = new Date()) => new Date(now.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);

/** Every YYYY-MM-DD from `from` to `to`, inclusive (pure calendar maths). */
export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end && days.length < 3700) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Shift a YYYY-MM-DD by a number of days. */
export function addDays(day: string, delta: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}
