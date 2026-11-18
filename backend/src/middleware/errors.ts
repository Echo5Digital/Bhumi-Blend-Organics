import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ZodError } from "zod";
import { HttpError } from "../lib/httpError.js";

// Every failure leaves the API in the same JSON shape:
//   { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": ... } }
// so the storefront and the admin panel handle errors in one place.

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` } });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const send = (status: number, code: string, message: string, details?: unknown) =>
    res.status(status).json({ error: { code, message, ...(details !== undefined && { details }) } });

  if (error instanceof HttpError) return send(error.status, error.code, error.message, error.details);

  if (error instanceof ZodError) {
    return send(
      400,
      "VALIDATION_ERROR",
      "Please check the highlighted details.",
      error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    );
  }

  // Body-parser problems (bad JSON, body too big) carry a `type`.
  const parserType = (error as { type?: string }).type;
  if (parserType === "entity.parse.failed") return send(400, "INVALID_JSON", "The request body is not valid JSON.");
  if (parserType === "entity.too.large") return send(413, "PAYLOAD_TOO_LARGE", "The request is too large.");

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") return send(413, "FILE_TOO_LARGE", "That image is too large (5 MB at most).");
    return send(400, "UPLOAD_ERROR", "The upload could not be read.");
  }

  // A unique field (slug, coupon code, email) already exists.
  if ((error as { code?: number }).code === 11000) {
    const fields = Object.keys((error as { keyPattern?: Record<string, unknown> }).keyPattern ?? {});
    return send(409, "DUPLICATE", `${fields.join(", ") || "That value"} is already in use.`, { fields });
  }

  // e.g. /api/admin/products/not-an-id
  if (error instanceof mongoose.Error.CastError) return send(400, "INVALID_ID", "That id is not valid.");
  if (error instanceof mongoose.Error.ValidationError) {
    return send(
      400,
      "VALIDATION_ERROR",
      "Some values are not valid.",
      Object.values(error.errors).map((issue) => ({ path: issue.path, message: issue.message })),
    );
  }

  console.error(error);
  return send(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
};
