import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { HttpError } from "../../lib/httpError.js";
import { parse } from "../../lib/validation.js";
import type { ImageStore, MediaKind } from "../../services/images.js";

// Photo and video uploads for the admin panel. The file is held in memory (photos 5 MB at
// most, videos 50 MB) and streamed straight to Cloudinary — nothing is written to this server's disk.

const IMAGES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
// MP4 and WebM play in every browser; phone .mov files (HEVC) don't in most, so they are turned away.
const VIDEOS = new Set(["video/mp4", "video/webm"]);

const MB = 1024 * 1024;
const MAX_IMAGE = 5 * MB;
const MAX_VIDEO = 50 * MB;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (IMAGES.has(file.mimetype) || VIDEOS.has(file.mimetype)) callback(null, true);
    else callback(new HttpError(415, "UNSUPPORTED_FILE", "Please choose a JPG, PNG, WebP, GIF or AVIF photo, or an MP4 or WebM video."));
  },
});

export function adminUploadRoutes(images: ImageStore): Router {
  const router = Router();

  // POST /api/admin/uploads   multipart form, file field "file"  →  { url, publicId, width, height, kind, poster? }
  router.post("/", upload.single("file"), async (req, res) => {
    if (!req.file) throw HttpError.badRequest("Choose a photo or video to upload.", [{ path: "file", message: "Required." }], "VALIDATION_ERROR");
    const kind: MediaKind = VIDEOS.has(req.file.mimetype) ? "video" : "image";
    if (kind === "image" && req.file.size > MAX_IMAGE) throw new HttpError(413, "FILE_TOO_LARGE", "That photo is too large (5 MB at most).");
    const stored = await images.upload(req.file.buffer, { kind });
    res.status(201).json({ ...stored, kind });
  });

  // DELETE /api/admin/uploads?publicId=bhumiblend/abc123
  router.delete("/", async (req, res) => {
    const { publicId } = parse(z.object({ publicId: z.string().trim().min(1).max(300) }), req.query);
    await images.remove(publicId);
    res.status(204).end();
  });

  return router;
}
