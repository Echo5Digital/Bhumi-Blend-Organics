// Talks to the backend (../backend). The address comes from NEXT_PUBLIC_API_URL
// (set it in frontend/.env.local, e.g. https://api.yourshop.com); without it the
// storefront looks for the API on this computer, where `npm run dev` in
// backend/ listens.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

/** What the backend sends back when something is wrong, ready to show a visitor. */
export class ApiError extends Error {
  readonly status: number;
  /** Short machine-readable reason, e.g. "INVALID_CREDENTIALS" or "EMAIL_TAKEN". */
  readonly code: string;
  /** Per-field problems ("firstName": "Please enter your first name."), when the backend lists them. */
  readonly fields: Record<string, string>;
  /** For "please wait" answers (HTTP 429): how many seconds until trying again is allowed. */
  readonly retryAfterSeconds?: number;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** A logged-in visitor's token (lib/auth.ts). */
  token?: string;
  /** Extra headers, e.g. the `X-Order-Token` that lets this browser cancel an order it placed. */
  headers?: Record<string, string>;
};

export async function api<T>(path: string, { method = "GET", body, token, headers }: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    // While developing, say what is almost always wrong. This text is compiled out of the live site.
    const developerHint =
      process.env.NODE_ENV === "development"
        ? ` (Developer note: is the backend running? Start it with "npm run dev" in the backend folder; this page expects it at ${API_URL}.)`
        : "";
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `We couldn't reach the store just now. Please check your connection and try again.${developerHint}`,
    );
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    const fields: Record<string, string> = {};
    if (Array.isArray(error?.details)) {
      for (const detail of error.details as { path?: string; message?: string }[]) {
        if (detail?.path && detail.message && !(detail.path in fields)) fields[detail.path] = detail.message;
      }
    }
    const details = error?.details;
    const retry = details && !Array.isArray(details) ? (details as { retryAfterSeconds?: unknown }).retryAfterSeconds : undefined;
    throw new ApiError(
      response.status,
      error?.code ?? "UNKNOWN_ERROR",
      error?.message ?? "Something went wrong. Please try again.",
      fields,
      typeof retry === "number" ? retry : undefined,
    );
  }
  return data as T;
}
