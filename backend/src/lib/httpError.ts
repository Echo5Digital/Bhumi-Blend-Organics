// One error type for "the request can't be done": it carries the HTTP status and
// a short machine-readable `code` the frontend can switch on, plus a message
// that is safe to show to a visitor. The error middleware turns it into JSON.

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown, code = "BAD_REQUEST") {
    return new HttpError(400, code, message, details);
  }
  static unauthorized(message = "Please log in.", code = "UNAUTHORIZED") {
    return new HttpError(401, code, message);
  }
  static forbidden(message = "You don't have access to this.") {
    return new HttpError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Not found.", code = "NOT_FOUND") {
    return new HttpError(404, code, message);
  }
  static conflict(message: string, code = "CONFLICT") {
    return new HttpError(409, code, message);
  }
  static tooMany(message: string, code = "RATE_LIMITED", details?: unknown) {
    return new HttpError(429, code, message, details);
  }
  static unavailable(message: string, code = "SERVICE_UNAVAILABLE") {
    return new HttpError(503, code, message);
  }
}
