import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { HttpError } from "../../lib/httpError.js";
import { parse } from "../../lib/validation.js";
import type { ImageStore } from "../../services/images.js";

// Photo uploads for the admin panel. The file is held in memory (5 MB at most)
// and streamed straight to Cloudinary — nothing is written to this server's disk.

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED.has(file.mimetype)) callback(null, true);
    else callback(new HttpError(415, "UNSUPPORTED_FILE", "Please choose a JPG, PNG, WebP, GIF or AVIF image."));
  },
});

export function adminUploadRoutes(images: ImageStore): Router {
  const router = Router();

  // POST /api/admin/uploads   multipart form, file field "file"  →  { url, publicId, width, height }
  router.post("/", upload.single("file"), async (req, res) => {
    if (!req.file) throw HttpError.badRequest("Choose an image to upload.", [{ path: "file", message: "Required." }], "VALIDATION_ERROR");
    const stored = await images.upload(req.file.buffer);
    res.status(201).json(stored);
  });

  // DELETE /api/admin/uploads?publicId=bhumiblend/abc123
  router.delete("/", async (req, res) => {
    const { publicId } = parse(z.object({ publicId: z.string().trim().min(1).max(300) }), req.query);
    await images.remove(publicId);
    res.status(204).end();
  });

  return router;
}
