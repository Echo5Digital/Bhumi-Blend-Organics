// Talks to the backend (../../../backend). Its address comes from NEXT_PUBLIC_API_URL, the same
// variable the storefront uses, and defaults to local development. The admin is served by the
// storefront itself, so links to the shop are plain paths ("/product/…") and need no address.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

/** What the backend sends back when something is wrong, ready to show. */
export class ApiError extends Error {
  readonly status: number;
  /** Short machine-readable reason, e.g. "INVALID_STATUS_CHANGE". */
  readonly code: string;
  /** Per-field problems, keyed by field path ("address.pin"). */
  readonly fields: Record<string, string>;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

type Options = { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown; token?: string | null };

async function send(path: string, init: RequestInit, token?: string | null): Promise<Response> {
  try {
    return await fetch(`${API_URL}/api${path}`, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", `Can't reach the backend at ${API_URL}. Is it running? Start it with "npm run dev" in the backend folder.`);
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    const fields: Record<string, string> = {};
    if (Array.isArray(error?.details)) {
      for (const detail of error.details as { path?: string; message?: string }[]) {
        if (detail?.path && detail.message && !(detail.path in fields)) fields[detail.path] = detail.message;
      }
    }
    throw new ApiError(response.status, error?.code ?? "UNKNOWN_ERROR", error?.message ?? "Something went wrong.", fields);
  }
  return data as T;
}

export async function api<T>(path: string, { method = "GET", body, token }: Options = {}): Promise<T> {
  const init: RequestInit = {
    method,
    ...(body !== undefined && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  };
  return parse<T>(await send(path, init, token));
}

export type UploadedMedia = { url: string; publicId: string; kind: "image" | "video"; width?: number; height?: number; /** A video's still frame. */ poster?: string };

/** Upload a photo or video (admin only); the backend stores it on Cloudinary and returns its address. */
export async function uploadMedia(file: File, token: string | null) {
  const form = new FormData();
  form.append("file", file);
  return parse<UploadedMedia>(await send("/admin/uploads", { method: "POST", body: form }, token));
}

/** Upload a photo (admin only). */
export const uploadImage = uploadMedia;

/**
 * A photo address that works in the admin. Photos not yet moved to Cloudinary are stored as
 * storefront paths ("/Hair-Oil.jpg"); the admin is served by the storefront, so those open as they are.
 */
export function imageSrc(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith("/") ? encodeURI(url) : url;
}
