// Helpers for moving the storefront's photos to Cloudinary: find every string
// in a product that is a path to a photo in frontend/public ("/Hair-Oil.jpg"),
// and swap those strings for their new Cloudinary addresses.

const LOCAL_IMAGE = /^\/[^?#]+\.(?:jpe?g|png|webp|gif|avif|svg)$/i;

export const isLocalImagePath = (value: unknown): value is string => typeof value === "string" && LOCAL_IMAGE.test(value);

/** Every distinct local photo path found anywhere inside `value` (objects, arrays, nested). */
export function collectLocalImagePaths(value: unknown, found = new Set<string>(), seen = new WeakSet<object>()): Set<string> {
  if (isLocalImagePath(value)) {
    found.add(value);
  } else if (value && typeof value === "object") {
    if (seen.has(value)) return found; // an object that contains itself (e.g. a live Mongoose document)
    seen.add(value);
    for (const item of Array.isArray(value) ? value : Object.values(value)) collectLocalImagePaths(item, found, seen);
  }
  return found;
}

/** A copy of `value` with each local photo path replaced by `urls.get(path)` (paths not in the map stay as they were). */
export function replaceLocalImagePaths<T>(value: T, urls: Map<string, string>): T {
  if (isLocalImagePath(value)) return (urls.get(value) ?? value) as T;
  if (Array.isArray(value)) return value.map((item) => replaceLocalImagePaths(item, urls)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceLocalImagePaths(item, urls)])) as T;
  }
  return value;
}

/** "/Hair-Oil-2_03-1 (1).jpg" → "Hair-Oil-2_03-1-1" — a safe Cloudinary id (no folders, spaces or brackets). */
export function publicIdFor(localPath: string): string {
  return localPath
    .replace(/^\/+/, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
